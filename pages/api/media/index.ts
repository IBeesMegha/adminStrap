import { NextApiRequest, NextApiResponse } from 'next';
import { PrismaClient } from '@prisma/client';
import formidable from 'formidable';
import fs from 'fs/promises';
import path from 'path';

const prisma = new PrismaClient();

export const config = {
  api: {
    bodyParser: false,
  },
};

// GET - Get all media assets
async function handleGet(req: NextApiRequest, res: NextApiResponse) {
  try {
    const media = await prisma.media.findMany({
      orderBy: { createdAt: 'desc' },
    });

    res.status(200).json(media);
  } catch (error) {
    console.error('Error fetching media:', error);
    res.status(500).json({ error: 'Failed to fetch media' });
  }
}

// POST - Upload new media
async function handlePost(req: NextApiRequest, res: NextApiResponse) {
  try {
    const form = formidable({
      uploadDir: path.join(process.cwd(), 'public', 'uploads'),
      keepExtensions: true,
      maxFileSize: 10 * 1024 * 1024, // 10MB
    });

    // Ensure upload directory exists
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    try {
      await fs.access(uploadDir);
    } catch {
      await fs.mkdir(uploadDir, { recursive: true });
    }

    const [fields, files] = await form.parse(req);

    let mediaData: any = {};

    // Handle file upload
    if (files.file && files.file[0]) {
      const file = files.file[0];
      const fileName = file.newFilename;
      const url = `/uploads/${fileName}`;

      mediaData = {
        name: fields.name?.[0] || file.originalFilename || fileName,
        url,
        mime: file.mimetype || 'application/octet-stream',
        size: file.size,
        ext: path.extname(file.originalFilename || fileName),
        alternativeText: fields.alternativeText?.[0] || '',
        caption: fields.caption?.[0] || '',
      };
    }
    // Handle URL upload
    else if (fields.url && fields.url[0]) {
      const url = fields.url[0];
      const fileName = fields.name?.[0] || url.split('/').pop() || 'image';
      const ext = path.extname(fileName) || '.jpg';

      mediaData = {
        name: fileName,
        url,
        mime: `image/${ext.slice(1)}`,
        size: 0,
        ext,
        alternativeText: fields.alternativeText?.[0] || '',
        caption: fields.caption?.[0] || '',
      };
    } else {
      return res.status(400).json({ error: 'No file or URL provided' });
    }

    const media = await prisma.media.create({
      data: mediaData,
    });

    res.status(201).json(media);
  } catch (error) {
    console.error('Error uploading media:', error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  switch (req.method) {
    case 'GET':
      return handleGet(req, res);
    case 'POST':
      return handlePost(req, res);
    default:
      res.setHeader('Allow', ['GET', 'POST']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
