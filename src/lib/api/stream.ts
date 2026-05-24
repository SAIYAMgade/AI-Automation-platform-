export async function* streamWords(text: string, chunkSize = 7) {
  const words = text.split(/(\s+)/);
  let buffer = "";

  for (const word of words) {
    buffer += word;
    if (buffer.length >= chunkSize * 6 || /[.!?]\s*$/.test(buffer)) {
      yield buffer;
      buffer = "";
      await new Promise((resolve) => setTimeout(resolve, 18));
    }
  }

  if (buffer) {
    yield buffer;
  }
}
