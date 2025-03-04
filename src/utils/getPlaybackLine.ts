const lineLength = 28;

export const getPlaybackLine = (currentPosition: number, endPosition: number) => {
  const cursorPosition = Math.ceil((currentPosition / endPosition) * lineLength);
  const line = new Array(lineLength).fill('-');
  line[cursorPosition - 1] = '|';

  return line.join('');
};
