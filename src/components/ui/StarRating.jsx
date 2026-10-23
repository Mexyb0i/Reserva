function StarRating({ value = 0, onChange, readOnly = false, label = 'Rating' }) {
  return (
    <div className="flex items-center gap-1" role={readOnly ? 'img' : 'group'} aria-label={label}>
      {[1, 2, 3, 4, 5].map((star) =>
        readOnly ? (
          <span
            key={star}
            aria-hidden="true"
            className={`text-xl ${star <= value ? 'text-accent' : 'text-muted'}`}
          >
            ★
          </span>
        ) : (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            aria-label={`${star} ${star === 1 ? 'star' : 'stars'}`}
            aria-pressed={star === value}
            className={`rounded px-0.5 text-xl leading-none transition-colors ${star <= value ? 'text-accent' : 'text-muted hover:text-accent'}`}
          >
            ★
          </button>
        ),
      )}
    </div>
  )
}

export default StarRating
