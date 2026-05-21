import type { NextApiRequest, NextApiResponse } from 'next';
import { prisma } from '@/lib/prisma';
import { ApiResponse } from '@/lib/types';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  const { name } = req.query;

  if (typeof name !== 'string') {
    return res.status(400).json({ error: 'Invalid single type name' });
  }

  try {
    if (req.method === 'GET') {
      // Get specific single type by name (not slug!)
      const singleType = await prisma.singleType.findUnique({
        where: { name: name }, // Use name parameter from URL, not slug from data
      });

      if (!singleType) {
        return res.status(404).json({ error: 'Single type not found' });
      }

      console.log(`[Single Type API GET] Found single type: ${singleType.name}`);

      // Return only the data content, not the schema fields
      // The schema is available via /api/single-types endpoint for admin purposes
      // const response: any = {
      //   id: singleType.id,
      //   name: singleType.name,
      //   displayName: singleType.displayName,
      //   description: singleType.description,
      //   data: singleType.data,
      //   createdAt: singleType.createdAt,
      //   updatedAt: singleType.updatedAt,
      // };

      // Only include fields if explicitly requested (for admin UI)
      // const includeFields = req.query.includeFields === 'true';
      // if (includeFields) {
      //   response.fields = singleType.fields;
      // }

      return res.status(200).json({ data: singleType.data });
    }

    if (req.method === 'PUT') {
      // Update single type (structure or data)
      const { displayName, description, fields, data } = req.body;

      const updateData: any = {};
      if (displayName !== undefined) updateData.displayName = displayName;
      if (description !== undefined) updateData.description = description;
      if (fields !== undefined) updateData.fields = fields;
      if (data !== undefined) updateData.data = data;

      const singleType = await prisma.singleType.update({
        where: { name },
        data: updateData,
      });

      return res.status(200).json({ data: singleType });
    }

    if (req.method === 'DELETE') {
      // Delete single type
      await prisma.singleType.delete({
        where: { name },
      });

      return res.status(200).json({ message: 'Single type deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Single Type API Error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
