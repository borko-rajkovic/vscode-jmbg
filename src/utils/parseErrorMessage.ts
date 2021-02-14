import { InvalidReason } from 'ts-jmbg';

export const parseErrorMessage = (message: InvalidReason): string => {
  switch (message) {
    case InvalidReason.NOT_STRING:
      return 'Not string';
    case InvalidReason.MUST_CONTAIN_EXACTLY_13_DIGITS:
      return 'Must contain exactly 13 digits';
    case InvalidReason.INVALID_DATE:
      return 'Invalid date';
    case InvalidReason.INVALID_CONTROL_NUMBER:
      return 'Invalid control number';
  }
};
