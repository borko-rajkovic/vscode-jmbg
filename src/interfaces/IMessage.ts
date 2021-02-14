import { PersonData } from 'ts-jmbg';

export interface IMessage {
  text: string;
  valid: boolean;
  reason: string;
  decoded: PersonData;
}
