import { emptyDecoded } from './emptyDecoded';
import { IMessage } from '../../interfaces/IMessage';

export const emptyMessage: IMessage = {
  text: null,
  valid: false,
  reason: null,
  decoded: emptyDecoded,
};
