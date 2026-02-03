import { Request, Response } from 'express';

class TestUploadController {
  async testUpload(req: Request, res: Response): Promise<Response> {
    console.log('=== TEST UPLOAD ===');
    console.log('Headers:', req.headers);
    console.log('Body:', req.body);
    console.log('File:', req.file);
    console.log('Files:', req.files);
    
    if (req.file) {
      console.log('File details:', {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        encoding: req.file.encoding,
        mimetype: req.file.mimetype,
        size: req.file.size,
        bufferLength: req.file.buffer ? req.file.buffer.length : 'no buffer'
      });
    }
    
    return res.json({
      success: true,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
        hasBuffer: !!req.file.buffer,
        bufferLength: req.file.buffer ? req.file.buffer.length : 0
      } : null
    });
  }
}

export default new TestUploadController();
