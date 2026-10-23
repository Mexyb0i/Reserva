import { useCallback, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import AsyncState from '../components/ui/AsyncState'
import Button from '../components/ui/Button'
import Card from '../components/ui/Card'
import PageHeading from '../components/ui/PageHeading'
import Select from '../components/ui/Select'
import StarRating from '../components/ui/StarRating'
import useAsyncResource from '../hooks/useAsyncResource'
import { facilityService } from '../services/facilityService'
import { userService } from '../services/userService'

function FeedbackPage() {
  const [searchParams] = useSearchParams()
  const [facilityId, setFacilityId] = useState(searchParams.get('facility') ?? '1')
  const [rating, setRating] = useState(0)
  const [comment, setComment] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const loader = useCallback(async () => {
    const [facilities, reviews] = await Promise.all([
      facilityService.getFacilities(),
      userService.getReviews(),
    ])
    return { facilities, reviews }
  }, [])
  const { data, isLoading, error, reload } = useAsyncResource(loader)

  async function submitFeedback(event) {
    event.preventDefault()
    setErrorMessage('')
    setSuccessMessage('')
    if (!rating) {
      setErrorMessage('Choose a star rating before submitting.')
      return
    }
    if (comment.trim().length < 8) {
      setErrorMessage('Please add a little more detail to your review.')
      return
    }
    setIsSubmitting(true)
    try {
      await userService.submitReview({
        facility: data.facilities.find((item) => String(item.id) === facilityId)?.name ?? 'Facility',
        rating,
        text: comment.trim(),
      })
      setComment('')
      setRating(0)
      setSuccessMessage('Thanks for sharing your feedback.')
      reload()
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : 'Your review could not be submitted.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <PageHeading title="Feedback & Ratings" description="Tell other players about your experience." />
      <AsyncState loading={isLoading} error={error} onRetry={reload} />
      {data ? (
        <>
          <Card>
            <form onSubmit={submitFeedback} className="space-y-4">
              <Select
                label="Facility"
                value={facilityId}
                onChange={(event) => setFacilityId(event.target.value)}
                options={data.facilities.map((facility) => ({ value: String(facility.id), label: facility.name }))}
              />
              <fieldset>
                <legend className="mb-2 text-xs font-medium text-muted">Your rating</legend>
                <StarRating value={rating} onChange={setRating} label="Select a rating from one to five stars" />
              </fieldset>
              <label className="block">
                <span className="mb-1.5 block text-xs font-medium text-muted">Your review</span>
                <textarea
                  rows="4"
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="What did you like about this facility?"
                  className="w-full resize-y rounded-md border border-border bg-bg px-3 py-2 text-sm text-text placeholder:text-muted"
                />
              </label>
              {errorMessage ? <p role="alert" className="text-sm text-danger">{errorMessage}</p> : null}
              {successMessage ? <p role="status" className="text-sm text-success">{successMessage}</p> : null}
              <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Submitting…' : 'Submit review'}</Button>
            </form>
          </Card>
          <section className="space-y-3">
            <h2 className="text-sm font-bold">Recent Reviews</h2>
            {data.reviews.length ? data.reviews.map((review) => (
              <Card key={review.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-semibold">{review.user}</h3>
                    <p className="mt-1 text-xs text-muted">{review.facility ?? 'Sports Facility'}</p>
                  </div>
                  <StarRating value={review.rating} readOnly label={`${review.rating} out of 5 stars`} />
                </div>
                <p className="mt-3 text-sm leading-6 text-muted">{review.text}</p>
              </Card>
            )) : (
              <Card><p className="text-sm text-muted">No reviews yet.</p></Card>
            )}
          </section>
        </>
      ) : null}
      <Link to="/sports-facilities" className="inline-block text-xs font-semibold text-success hover:underline">Browse facilities</Link>
    </div>
  )
}

export default FeedbackPage
