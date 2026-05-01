import { Router } from 'express'
import multer from 'multer'
import StaffMember from '../models/StaffMember'
import { requireAuth, requireRole } from '../middleware/auth'
import { uploadImageBufferToCloudinary } from '../utils/cloudinary'

const router = Router()

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: function (_req, file, cb) {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'))
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
})

// GET /api/staff (public)
router.get('/', async (_req, res) => {
  try {
    const list = await StaffMember.find().sort({ createdAt: 1 })
    res.json(list)
  } catch (err) {
    console.error('Error GET /api/staff', err)
    res.status(500).json({ message: 'Failed to list staff members' })
  }
})

// POST /api/staff/upload-photo (Admin or Professor)
router.post(
  '/upload-photo',
  requireAuth,
  requireRole(['Admin', 'Professor']),
  upload.single('photo'),
  async (req: any, res: any) => {
    try {
      if (!req.file) return res.status(400).json({ message: 'No file uploaded' })
      const file = req.file as any
      const uploaded = await uploadImageBufferToCloudinary(file.buffer, file.originalname)
      return res.json({ url: uploaded.secure_url })
    } catch (err: any) {
      console.error('Error POST /api/staff/upload-photo', err)
      return res.status(500).json({ message: err?.message || 'Failed to upload staff photo' })
    }
  }
)

// POST /api/staff (Admin or Professor)
router.post('/', requireAuth, requireRole(['Admin', 'Professor']), async (req, res) => {
  try {
    const created = await StaffMember.create(req.body)
    res.json(created)
  } catch (err: any) {
    console.error('Error POST /api/staff', err)
    if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message })
    res.status(500).json({ message: err?.message || 'Failed to create staff member' })
  }
})

// PUT /api/staff/:id (Admin or Professor)
router.put('/:id', requireAuth, requireRole(['Admin', 'Professor']), async (req, res) => {
  try {
    const updated = await StaffMember.findByIdAndUpdate(req.params.id, req.body, { new: true })
    res.json(updated)
  } catch (err: any) {
    console.error('Error PUT /api/staff/:id', err)
    res.status(500).json({ message: err?.message || 'Failed to update staff member' })
  }
})

// DELETE /api/staff/:id (Admin or Professor)
router.delete('/:id', requireAuth, requireRole(['Admin', 'Professor']), async (req, res) => {
  try {
    await StaffMember.findByIdAndDelete(req.params.id)
    res.json({ ok: true })
  } catch (err: any) {
    console.error('Error DELETE /api/staff/:id', err)
    res.status(500).json({ message: err?.message || 'Failed to delete staff member' })
  }
})

export default router

