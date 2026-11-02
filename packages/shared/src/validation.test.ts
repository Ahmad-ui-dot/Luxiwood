import { isValidPhone, normalizePhone } from './validation';

describe('normalizePhone', () => {
  it.each([
    ['+992 90 123 45 67', '+992901234567'],
    ['+992901234567', '+992901234567'],
    [' +992 901 234 567 ', '+992901234567'],
  ])('принимает %p', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(['992901234567', '+99290123456', '+9929012345678', '+7 900 123 45 67', '+992 90 123 45 6a', '+992-90-123-45-67', ''])(
    'отклоняет %p',
    (input) => {
      expect(normalizePhone(input)).toBeNull();
      expect(isValidPhone(input)).toBe(false);
    },
  );
});
