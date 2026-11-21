import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import ContactSection from './ContactSection'
import { SiteContext } from '../SiteContext'
import { SITE_COPY } from '../content'

const copy = SITE_COPY.en
const form = copy.contact.form

function renderForm(path = '/') {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <SiteContext.Provider value={{ locale: 'en', copy }}>
        <ContactSection />
      </SiteContext.Provider>
    </MemoryRouter>,
  )
}

async function fillRequired() {
  const user = userEvent.setup()
  await user.type(screen.getByLabelText(form.fullName), 'Ana Weber')
  await user.type(screen.getByLabelText(form.email), 'ana@example.com')
  await user.type(screen.getByLabelText(form.restaurant), 'Riverside Kitchen')
  await user.click(screen.getByRole('checkbox'))
  return user
}

describe('ContactSection', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('shows field errors and sends nothing when required fields are empty', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    await userEvent.setup().click(screen.getByRole('button', { name: form.submit }))

    expect(screen.getAllByText(form.required)).toHaveLength(4)
    expect(screen.getByLabelText(form.fullName)).toHaveAttribute('aria-invalid', 'true')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('rejects an invalid email address', async () => {
    renderForm()
    const user = userEvent.setup()
    await user.type(screen.getByLabelText(form.email), 'not-an-email')
    await user.click(screen.getByRole('button', { name: form.submit }))
    expect(screen.getByText(form.invalidEmail)).toBeInTheDocument()
  })

  it('sends the request and confirms where the reply goes', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: 'true' }) })
    vi.stubGlobal('fetch', fetchMock)
    renderForm()

    const user = await fillRequired()
    await user.click(screen.getByRole('button', { name: form.submit }))

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const body = JSON.parse(fetchMock.mock.calls[0][1].body)
    expect(body).toMatchObject({ name: 'Ana Weber', email: 'ana@example.com', restaurant: 'Riverside Kitchen', language: 'en' })
    expect(await screen.findByRole('status')).toHaveTextContent('ana@example.com')
  })

  it('treats a 200 response that rejects the request as a failure', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: 'false', message: 'This form needs Activation.' }) }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderForm()

    const user = await fillRequired()
    await user.click(screen.getByRole('button', { name: form.submit }))

    expect(await screen.findByRole('alert')).toHaveTextContent('hello@getmasova.rest')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('tells the visitor to email the team when sending fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 500 }))
    vi.spyOn(console, 'error').mockImplementation(() => {})
    renderForm()

    const user = await fillRequired()
    await user.click(screen.getByRole('button', { name: form.submit }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('hello@getmasova.rest')
  })

  it('silently accepts submissions that fill the hidden honeypot field', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const { container } = renderForm()

    const user = userEvent.setup()
    await user.type(container.querySelector<HTMLInputElement>('#ms-f-website')!, 'spam')
    await user.click(screen.getByRole('button', { name: form.submit }))

    expect(fetchMock).not.toHaveBeenCalled()
    expect(screen.getByRole('status')).toHaveTextContent(form.successTitle)
  })
})

describe('ContactSection prefill from the concierge', () => {
  it('picks the site count the visitor chose', () => {
    renderForm('/contact?sites=2')
    expect(screen.getByLabelText(new RegExp(form.sites))).toHaveValue(form.sitesOptions[2])
  })

  it.each(['', 'abc', '-1', '99', '1e0', '2.0'])('ignores ?sites=%s', (value) => {
    renderForm(`/contact?sites=${value}`)
    expect(screen.getByLabelText(new RegExp(form.sites))).toHaveValue('')
  })
})
