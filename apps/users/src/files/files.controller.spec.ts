import { FilesController } from './files.controller';
import { FilesService } from '../../../../core/modules/files/files.service';
import { filesResponses } from '../../../../core/common/responses';
import type { IFileInterface } from '../../../../core/common/interfaces';
import type { IUserReq } from '../../../../core/common/interfaces';
import type { UploadFileDto } from '../../../../core/modules/files/dto/upload-file.dto';

/**
 * Unit tests for {@link FilesController} (users app).
 */
describe('FilesController (users)', () => {
  let controller: FilesController;
  const filesServiceMock = {
    uploadFile: jest.fn(),
  };
  const user: IUserReq = { userId: 5, username: 'tester' };

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new FilesController(
      filesServiceMock as unknown as FilesService,
    );
  });

  describe('uploadFile', () => {
    it('returns success payload with uploaded file metadata', async () => {
      const uploaded = { id: 100, name: 'photo.jpg' };
      filesServiceMock.uploadFile.mockResolvedValue(uploaded);
      const file = {} as IFileInterface;
      const data = {} as UploadFileDto;
      const result = await controller.uploadFile(file, data, user);
      expect(filesServiceMock.uploadFile).toHaveBeenCalledWith(file, data, user);
      expect(result).toEqual({
        ...filesResponses.upload.success,
        file: uploaded,
      });
    });
  });
});
