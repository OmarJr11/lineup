import { CreateTokenDto } from './create-token.dto';

describe('CreateTokenDto', () => {
  it('instantiates correctly with given properties', () => {
    const dto = new CreateTokenDto();
    dto.idUser = 1;
    dto.idBusiness = 2;
    dto.token = 'tok';
    dto.refresh = 'ref';
    dto.creationDate = new Date();

    expect(dto.idUser).toBe(1);
    expect(dto.idBusiness).toBe(2);
    expect(dto.token).toBe('tok');
    expect(dto.refresh).toBe('ref');
    expect(dto.creationDate).toBeInstanceOf(Date);
  });
});
