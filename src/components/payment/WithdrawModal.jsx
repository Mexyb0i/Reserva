import { useMemo, useState } from 'react'
import { calculateWithdrawal, formatPHP } from '../../utils/fees'
import Button from '../ui/Button'
import Input from '../ui/Input'
import Modal from '../ui/Modal'
import Select from '../ui/Select'

function WithdrawModal({
  open,
  onClose,
  balance,
  fees,
  payoutSchedule,
  accounts,
  onAddAccount,
  onVerifyAccount,
  onWithdraw,
  submitting,
}) {
  const [amount, setAmount] = useState('')
  const [accountId, setAccountId] = useState('')
  const [accountType, setAccountType] = useState('GCash')
  const [accountName, setAccountName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [verificationCodes, setVerificationCodes] = useState({})
  const [error, setError] = useState('')
  const [accountBusy, setAccountBusy] = useState(false)

  const verifiedAccounts = accounts.filter((account) => account.verified)
  const unverifiedAccounts = accounts.filter((account) => !account.verified)
  const amountToWithdraw = payoutSchedule === 'weekly' ? balance.available : Number(amount)
  const calculation = useMemo(
    () => calculateWithdrawal(amountToWithdraw, balance.available, fees),
    [amountToWithdraw, balance.available, fees],
  )
  const hasVerifiedAccounts = verifiedAccounts.length > 0

  async function addAccount(event) {
    event.preventDefault()
    setAccountBusy(true)
    setError('')
    try {
      const account = await onAddAccount({
        type: accountType,
        name: accountName,
        number: accountNumber,
      })
      setVerificationCodes((current) => ({ ...current, [account.id]: '' }))
      setAccountName('')
      setAccountNumber('')
    } catch (accountError) {
      setError(accountError instanceof Error ? accountError.message : 'Payout account could not be added.')
    } finally {
      setAccountBusy(false)
    }
  }

  async function verifyAccount(account) {
    setAccountBusy(true)
    setError('')
    try {
      await onVerifyAccount(account.id, verificationCodes[account.id] ?? '')
    } catch (verificationError) {
      setError(verificationError instanceof Error ? verificationError.message : 'Payout account could not be verified.')
    } finally {
      setAccountBusy(false)
    }
  }

  async function withdraw(event) {
    event.preventDefault()
    setError('')
    if (!hasVerifiedAccounts) {
      setError('Add and verify a payout account before withdrawing.')
      return
    }
    if (!accountId || !calculation.valid) return
    try {
      await onWithdraw({ amount: amountToWithdraw, accountId })
      setAmount('')
      setAccountId('')
      onClose()
    } catch (withdrawError) {
      setError(withdrawError instanceof Error ? withdrawError.message : 'Withdrawal could not be requested.')
    }
  }

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!submitting && !accountBusy) {
          setError('')
          onClose()
        }
      }}
      title="Withdraw earnings"
    >
      <div className="space-y-5">
        {payoutSchedule === 'weekly' ? (
          <div className="rounded-md border border-border bg-bg p-3">
            <p className="text-sm font-semibold">Next payout: {getNextPayoutDate()}</p>
            <p className="mt-1 text-xs text-muted">
              Available to withdraw: {formatPHP(balance.available)}
            </p>
            <p className="mt-2 text-xs text-muted">
              Fee {formatPHP(calculation.fee)} · You receive {formatPHP(calculation.net)}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-end gap-2">
              <Input
                label="Amount"
                type="number"
                min={fees.minWithdrawal}
                max={balance.available}
                step="0.01"
                value={amount}
                onChange={(event) => setAmount(event.target.value)}
                placeholder="Enter amount"
              />
              <Button
                variant="secondary"
                disabled={!balance.available || submitting}
                onClick={() => setAmount(String(balance.available))}
              >
                Max
              </Button>
            </div>
            <p className="text-xs text-muted">Minimum withdrawal: {formatPHP(fees.minWithdrawal)}.</p>
            {amount ? (
              <p className="text-sm">
                Fee <span className="font-semibold">{formatPHP(calculation.fee)}</span>
                {' · '}You receive <span className="font-semibold text-accent">{formatPHP(calculation.net)}</span>
              </p>
            ) : null}
            {!calculation.valid && amount ? <p role="status" className="text-xs text-danger">{calculation.reason}</p> : null}
          </div>
        )}

        {verifiedAccounts.length ? (
          <Select
            label="Verified destination"
            value={accountId}
            onChange={(event) => setAccountId(event.target.value)}
            options={[
              { value: '', label: 'Choose a payout account' },
              ...verifiedAccounts.map((account) => ({
                value: account.id,
                label: `${account.type} ···· ${account.number.slice(-4)}`,
              })),
            ]}
          />
        ) : (
          <p role="status" className="text-sm text-muted">Withdrawal is unavailable until a payout account is verified.</p>
        )}

        {unverifiedAccounts.map((account) => (
          <div key={account.id} className="rounded-md border border-border p-3">
            <p className="text-sm font-semibold">{account.type} ···· {account.number.slice(-4)}</p>
            <p className="mt-1 text-xs text-muted">Account holder: {account.name}. Verification code for this mock flow: 123456.</p>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <Input
                label="Verification code"
                value={verificationCodes[account.id] ?? ''}
                onChange={(event) => setVerificationCodes((current) => ({
                  ...current,
                  [account.id]: event.target.value,
                }))}
                inputMode="numeric"
                maxLength={6}
              />
              <Button
                variant="secondary"
                disabled={accountBusy || submitting || !verificationCodes[account.id]}
                onClick={() => verifyAccount(account)}
              >
                Verify account
              </Button>
            </div>
          </div>
        ))}

        <details className="rounded-md border border-border p-3">
          <summary className="cursor-pointer text-sm font-semibold">Add payout account</summary>
          <form className="mt-3 space-y-3" onSubmit={addAccount}>
            <Select
              label="Account type"
              value={accountType}
              onChange={(event) => setAccountType(event.target.value)}
              options={['GCash', 'Maya', 'Bank']}
            />
            <Input
              label="Account holder name"
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              required
            />
            <Input
              label="Account number"
              value={accountNumber}
              onChange={(event) => setAccountNumber(event.target.value)}
              inputMode="numeric"
              required
            />
            <Button type="submit" disabled={accountBusy || submitting}>
              {accountBusy ? 'Saving…' : 'Add account'}
            </Button>
          </form>
        </details>

        {error ? <p role="alert" className="text-sm text-danger">{error}</p> : null}
        <div className="flex justify-end gap-2 border-t border-border pt-4">
          <Button variant="secondary" disabled={submitting || accountBusy} onClick={onClose}>Close</Button>
          <Button
            disabled={
              submitting || accountBusy || !hasVerifiedAccounts || !accountId ||
              !calculation.valid || balance.available <= 0
            }
            onClick={withdraw}
          >
            {submitting ? 'Requesting…' : payoutSchedule === 'weekly' ? 'Withdraw all available' : 'Confirm withdrawal'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function getNextPayoutDate() {
  const next = new Date()
  const daysUntilMonday = ((8 - next.getDay()) % 7) || 7
  next.setDate(next.getDate() + daysUntilMonday)
  next.setHours(0, 0, 0, 0)
  return next.toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default WithdrawModal
