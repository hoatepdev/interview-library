import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { IsNull, Not } from "typeorm";
import { AuthService } from "./auth.service";
import { UserRole } from "../common/enums/role.enum";
import { createMockRepository, createMockUser } from "../test/test-utils";

describe("AuthService", () => {
  let service: AuthService;
  let userRepo: ReturnType<typeof createMockRepository>;

  beforeEach(() => {
    userRepo = createMockRepository();
    service = new AuthService(userRepo as any);
  });

  // ─── validateOAuthUser ─────────────────────────────────────────────────────

  describe("validateOAuthUser", () => {
    const mockProfile = {
      id: "google-123",
      emails: [{ value: "newuser@example.com" }],
      displayName: "New User",
      photos: [{ value: "https://example.com/avatar.jpg" }],
    };

    describe("new user creation", () => {
      it("creates a new user with data from the OAuth profile", async () => {
        userRepo.findOne.mockResolvedValueOnce(null); // no deleted user
        userRepo.findOne.mockResolvedValueOnce(null); // no existing user
        userRepo.count.mockResolvedValue(5);          // not first user
        const createdUser = createMockUser({ email: "newuser@example.com", role: UserRole.USER });
        userRepo.create.mockReturnValue(createdUser);
        userRepo.save.mockResolvedValue(createdUser);

        const result = await service.validateOAuthUser(mockProfile, "google");

        expect(userRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({
            email: "newuser@example.com",
            name: "New User",
            avatar: "https://example.com/avatar.jpg",
            provider: "google",
            providerId: "google-123",
            role: UserRole.USER,
          }),
        );
        expect(userRepo.save).toHaveBeenCalled();
        expect(result).toEqual(createdUser);
      });

      it("assigns ADMIN role to the first user in the system", async () => {
        userRepo.findOne.mockResolvedValueOnce(null); // no deleted user
        userRepo.findOne.mockResolvedValueOnce(null); // no existing user
        userRepo.count.mockResolvedValue(0);          // first user
        const adminUser = createMockUser({ role: UserRole.ADMIN });
        userRepo.create.mockReturnValue(adminUser);
        userRepo.save.mockResolvedValue(adminUser);

        await service.validateOAuthUser(mockProfile, "google");

        expect(userRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ role: UserRole.ADMIN }),
        );
      });

      it("assigns USER role to non-first users", async () => {
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.count.mockResolvedValue(10);
        const regularUser = createMockUser({ role: UserRole.USER });
        userRepo.create.mockReturnValue(regularUser);
        userRepo.save.mockResolvedValue(regularUser);

        await service.validateOAuthUser(mockProfile, "google");

        expect(userRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ role: UserRole.USER }),
        );
      });

      it("uses email prefix as name when displayName is missing", async () => {
        const profileWithoutName = {
          ...mockProfile,
          displayName: undefined,
          emails: [{ value: "john.doe@example.com" }],
        };
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.count.mockResolvedValue(1);
        const newUser = createMockUser({ name: "john.doe" });
        userRepo.create.mockReturnValue(newUser);
        userRepo.save.mockResolvedValue(newUser);

        await service.validateOAuthUser(profileWithoutName, "google");

        expect(userRepo.create).toHaveBeenCalledWith(
          expect.objectContaining({ name: "john.doe" }),
        );
      });
    });

    describe("existing user update", () => {
      it("updates name when displayName changed", async () => {
        const existingUser = createMockUser({ name: "Old Name", role: UserRole.USER });
        userRepo.findOne.mockResolvedValueOnce(null);      // no deleted user
        userRepo.findOne.mockResolvedValueOnce(existingUser); // existing user found
        userRepo.save.mockResolvedValue(existingUser);

        const profileWithNewName = { ...mockProfile, displayName: "New Name" };
        await service.validateOAuthUser(profileWithNewName, "google");

        expect(existingUser.name).toBe("New Name");
        expect(userRepo.save).toHaveBeenCalledWith(existingUser);
      });

      it("updates avatar when photo changed", async () => {
        const existingUser = createMockUser({ avatar: "https://old-avatar.com/pic.jpg" });
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(existingUser);
        userRepo.save.mockResolvedValue(existingUser);

        const profileWithNewAvatar = {
          ...mockProfile,
          photos: [{ value: "https://new-avatar.com/pic.jpg" }],
        };
        await service.validateOAuthUser(profileWithNewAvatar, "google");

        expect(existingUser.avatar).toBe("https://new-avatar.com/pic.jpg");
      });

      it("does NOT change user role on re-login", async () => {
        const modUser = createMockUser({ role: UserRole.MODERATOR });
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(modUser);
        userRepo.save.mockResolvedValue(modUser);

        await service.validateOAuthUser(mockProfile, "google");

        // Role should not be changed
        expect(modUser.role).toBe(UserRole.MODERATOR);
        expect(userRepo.count).not.toHaveBeenCalled();
      });
    });

    describe("soft-deleted user blocking", () => {
      it("throws ForbiddenException when the user account is soft-deleted", async () => {
        const deletedUser = createMockUser({ deletedAt: new Date() });
        userRepo.findOne.mockResolvedValueOnce(deletedUser); // deleted user found

        await expect(
          service.validateOAuthUser(mockProfile, "google"),
        ).rejects.toThrow(ForbiddenException);
      });

      it("queries for deleted user with withDeleted option and Not(IsNull()) condition", async () => {
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.findOne.mockResolvedValueOnce(null);
        userRepo.count.mockResolvedValue(1);
        userRepo.create.mockReturnValue(createMockUser());
        userRepo.save.mockResolvedValue(createMockUser());

        await service.validateOAuthUser(mockProfile, "google");

        expect(userRepo.findOne).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              email: "newuser@example.com",
            }),
            withDeleted: true,
          }),
        );
      });
    });

    describe("missing email validation", () => {
      it("throws an error when OAuth profile has no emails", async () => {
        const profileWithNoEmails = { ...mockProfile, emails: undefined };
        await expect(
          service.validateOAuthUser(profileWithNoEmails, "google"),
        ).rejects.toThrow("Email is required from OAuth provider");
      });

      it("throws an error when OAuth profile has empty emails array", async () => {
        const profileWithEmptyEmails = { ...mockProfile, emails: [] };
        await expect(
          service.validateOAuthUser(profileWithEmptyEmails, "google"),
        ).rejects.toThrow("Email is required from OAuth provider");
      });
    });
  });

  // ─── getUserProfile ────────────────────────────────────────────────────────

  describe("getUserProfile", () => {
    it("returns user when found", async () => {
      const user = createMockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.getUserProfile("user-uuid-1");
      expect(result).toEqual(user);
      expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: "user-uuid-1" } });
    });

    it("throws NotFoundException when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);
      await expect(service.getUserProfile("nonexistent-id")).rejects.toThrow(NotFoundException);
    });
  });

  // ─── findById ─────────────────────────────────────────────────────────────

  describe("findById", () => {
    it("returns user when found", async () => {
      const user = createMockUser();
      userRepo.findOne.mockResolvedValue(user);

      const result = await service.findById("user-uuid-1");
      expect(result).toEqual(user);
    });

    it("returns null when user not found", async () => {
      userRepo.findOne.mockResolvedValue(null);
      const result = await service.findById("nonexistent-id");
      expect(result).toBeNull();
    });
  });
});
