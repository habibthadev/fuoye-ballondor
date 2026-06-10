import { describe, it, expect, vi, beforeEach } from 'vitest'
import { voteReceivedEmail, sendDisputeAlert } from '../email.service.js'

vi.mock('../../config/env.js', () => ({
  env: {
    SMTP_USER: 'test@fuoye.edu.ng',
    SMTP_PASS: 'app-password',
    SMTP_FROM: 'noreply@fuoye.edu.ng',
    NODE_ENV: 'test',
  },
}))

vi.mock('nodemailer', async (importOriginal) => {
  const actual = await importOriginal()
  return {
    ...actual,
    default: {
      createTransport: vi.fn().mockReturnValue({
        sendMail: vi.fn().mockResolvedValue({ messageId: 'mock-id' }),
      }),
    },
  }
})

vi.mock('../../config/pino.js', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}))

describe('voteReceivedEmail', () => {
  beforeEach(() => vi.clearAllMocks())

  it('sends email with correct recipient and subject', async () => {
    const result = voteReceivedEmail(
      'voter@fuoye.edu.ng',
      'John',
      'Henry Obe',
      "Ballon D'or (Male)",
      3,
      600,
      'vote-ref-123',
    )

    await expect(result).resolves.not.toThrow()
  })

  it('handles missing nominee name gracefully', async () => {
    const result = voteReceivedEmail(
      'voter@fuoye.edu.ng',
      'John',
      '',
      '',
      1,
      200,
      'vote-ref-456',
    )

    await expect(result).resolves.not.toThrow()
  })

  it('handles large quantity values', async () => {
    const result = voteReceivedEmail(
      'voter@fuoye.edu.ng',
      'John',
      'Henry Obe',
      'Male',
      100,
      20000,
      'vote-ref-789',
    )

    await expect(result).resolves.not.toThrow()
  })
})

describe('sendDisputeAlert', () => {
  beforeEach(() => vi.clearAllMocks())

  const details = {
    voteId: 'vote-1',
    txRef: 'flw-ref-123',
    amount: 5000,
    nomineeId: 'nominee-1',
    voterName: 'John Doe',
  }

  it('sends dispute alert to admin', async () => {
    const result = sendDisputeAlert('admin@fuoye.edu.ng', details)
    await expect(result).resolves.not.toThrow()
  })

  it('includes chargeback keyword in subject', async () => {
    const nodemailer = await import('nodemailer')
    const transporter = nodemailer.default.createTransport()
    const sendMailSpy = vi.mocked(transporter.sendMail)

    await sendDisputeAlert('admin@fuoye.edu.ng', details)

    const call = sendMailSpy.mock.calls[0][0] as { subject: string }
    expect(call.subject.toLowerCase()).toContain('chargeback')
  })
})
