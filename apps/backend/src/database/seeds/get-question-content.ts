type SeedQuestionLike = {
  title: string;
  content?: string;
};

function hashString(value: string): string {
  let hash = 0;

  for (let index = 0; index < value.length; index++) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash.toString(16).padStart(8, "0");
}

export function getQuestionTitle(questionData: SeedQuestionLike): string {
  const title = questionData.title.trim();

  if (title.length <= 255) {
    return title;
  }

  const suffix = `... #${hashString(title)}`;
  const truncatedLength = 255 - suffix.length;

  return `${title.slice(0, truncatedLength)}${suffix}`;
}

export function getQuestionContent(questionData: SeedQuestionLike): string {
  const content = questionData.content?.trim();
  const title = questionData.title.trim();

  if (content) {
    if (title.length > 255) {
      return `Original title: ${title}\n\n${content}`;
    }

    return content;
  }

  return title;
}
