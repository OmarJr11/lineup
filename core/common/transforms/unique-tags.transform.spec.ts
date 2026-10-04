import { UniqueTags } from './unique-tags.transform';

describe('UniqueTags transform', () => {
  it('returns unique array of tags when tags are present', () => {
    expect(UniqueTags({ value: ['tag1', 'tag2', 'tag1'] })).toEqual([
      'tag1',
      'tag2',
    ]);
  });

  it('returns null when unique tags array is empty', () => {
    expect(UniqueTags({ value: [] })).toBeNull();
  });
});
