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

function parseFocus(value: unknown): string[] {
  if (Array.isArray(value)) return value.map((x) => String(x).trim()).filter(Boolean)
  if (typeof value !== 'string') return []
  const raw = value.trim()
  if (!raw) return []
  try {
    if (raw.startsWith('[')) {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) return parsed.map((x) => String(x).trim()).filter(Boolean)
    }
  } catch (_err) {
    // fallback handled below
  }
  return raw.split(',').map((x) => x.trim()).filter(Boolean)
}

async function uploadOptionalPhoto(req: any): Promise<{ photo?: string; warning?: string }> {
  const file = req.file as any
  if (!file) return {}
  try {
    const uploaded = await uploadImageBufferToCloudinary(file.buffer, file.originalname)
    return { photo: uploaded.secure_url }
  } catch (err: any) {
    console.error('Staff photo upload failed, continue without photo:', err?.message || err)
    return { warning: 'Photo upload failed; member saved without photo' }
  }
}

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

// POST /api/staff (Admin or Professor) - accepte JSON ou multipart/form-data (photo optionnelle)
router.post('/', requireAuth, requireRole(['Admin', 'Professor']), upload.single('photo'), async (req: any, res) => {
  try {
    const name = String(req.body?.name || '').trim()
    const title = String(req.body?.title || '').trim()
    const responsibility = String(req.body?.responsibility || '').trim()
    const email = String(req.body?.email || '').trim()
    const phone = String(req.body?.phone || '').trim()
    const office = String(req.body?.office || '').trim()
    const bio = String(req.body?.bio || '').trim()
    const focus = parseFocus(req.body?.focus)

    if (!name || !title || !responsibility || !email || !phone || !office || !bio) {
      return res.status(400).json({ message: 'Missing required fields' })
    }

    const photoResult = await uploadOptionalPhoto(req)
    const photoUrl = photoResult.photo ? String(photoResult.photo).trim() : undefined

    const created = await StaffMember.create({
      name,
      title,
      responsibility,
      email,
      phone,
      office,
      bio,
      focus,
      ...(photoUrl ? { photo: photoUrl } : {}),
    })
    res.json(photoResult.warning ? { ...created.toObject(), warning: photoResult.warning } : created)
  } catch (err: any) {
    console.error('Error POST /api/staff', err)
    if (err?.name === 'ValidationError') return res.status(400).json({ message: err.message })
    res.status(500).json({ message: err?.message || 'Failed to create staff member' })
  }
})

// PUT /api/staff/:id (Admin or Professor) - accepte JSON ou multipart/form-data (photo optionnelle)
router.put('/:id', requireAuth, requireRole(['Admin', 'Professor']), upload.single('photo'), async (req: any, res) => {
  try {
    const payload: any = {}
    const assignString = (key: string) => {
      if (req.body && Object.prototype.hasOwnProperty.call(req.body, key)) {
        payload[key] = String(req.body[key]).trim()
      }
    }

    assignString('name')
    assignString('title')
    assignString('responsibility')
    assignString('email')
    assignString('phone')
    assignString('office')
    assignString('bio')

    if (req.body && Object.prototype.hasOwnProperty.call(req.body, 'focus')) {
      payload.focus = parseFocus(req.body.focus)
    }

    const photoResult = await uploadOptionalPhoto(req)
    if (photoResult.photo) payload.photo = String(photoResult.photo).trim()

    const updated = await StaffMember.findByIdAndUpdate(req.params.id, payload, { new: true })
    res.json(photoResult.warning && updated ? { ...updated.toObject(), warning: photoResult.warning } : updated)
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

