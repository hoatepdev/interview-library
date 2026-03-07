import { ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { UserRole } from "../enums/role.enum";
import { ROLES_KEY } from "../decorators/roles.decorator";

function createMockExecutionContext(
  user: { role: UserRole } | null,
  roles: UserRole[] | null = null,
): ExecutionContext {
  const reflector = { getAllAndOverride: jest.fn().mockReturnValue(roles) } as any;
  (createMockExecutionContext as any)._reflector = reflector;

  return {
    getHandler: jest.fn().mockReturnValue({}),
    getClass: jest.fn().mockReturnValue({}),
    switchToHttp: jest.fn().mockReturnValue({
      getRequest: jest.fn().mockReturnValue({ user }),
    }),
  } as any;
}

describe("RolesGuard", () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as any;
    guard = new RolesGuard(reflector);
  });

  it("allows access when no @Roles decorator is applied (requiredRoles is undefined)", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows access when @Roles decorator has empty array", () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows access when user has the required role", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { role: UserRole.ADMIN } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows access when user has one of the multiple required roles (MODERATOR)", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MODERATOR, UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { role: UserRole.MODERATOR } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("allows access when user has one of the multiple required roles (ADMIN)", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MODERATOR, UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { role: UserRole.ADMIN } }),
      }),
    } as any;

    expect(guard.canActivate(context)).toBe(true);
  });

  it("throws ForbiddenException when user has insufficient role (USER trying MOD route)", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.MODERATOR, UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { role: UserRole.USER } }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Insufficient permissions");
  });

  it("throws ForbiddenException when no user on request", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
    expect(() => guard.canActivate(context)).toThrow("Access denied");
  });

  it("throws ForbiddenException when user exists but has no role property", () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const context = {
      getHandler: jest.fn().mockReturnValue({}),
      getClass: jest.fn().mockReturnValue({}),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: { id: "some-id" } }), // user without role
      }),
    } as any;

    expect(() => guard.canActivate(context)).toThrow(ForbiddenException);
  });

  it("uses ROLES_KEY to read metadata from reflector", () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    const mockHandler = jest.fn();
    const mockClass = jest.fn();
    const context = {
      getHandler: jest.fn().mockReturnValue(mockHandler),
      getClass: jest.fn().mockReturnValue(mockClass),
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({ user: null }),
      }),
    } as any;

    guard.canActivate(context);

    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [mockHandler, mockClass]);
  });
});
