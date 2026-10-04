import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { UserUniqueFieldsDto } from './unique.dto';

describe('UserUniqueFieldsDto', () => {
  it('transforms email to lower case and validates successfully', async () => {
    const dto = plainToInstance(UserUniqueFieldsDto, {
      username: 'johndoe',
      email: 'JohnDoe@Example.COM',
    });

    expect(dto.email).toBe('johndoe@example.com');
    const errors = await validate(dto);
    expect(errors.length).toBe(0);
  });

  it('fails validation when required fields are empty', async () => {
    const dto = plainToInstance(UserUniqueFieldsDto, {
      username: '',
      email: 'not-an-email',
    });

    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });
});
