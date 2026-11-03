import { Icon } from "@/components/icon";

type RatingStarsProps = {
  rating: number;
  count?: number;
  size?: number;
  className?: string;
};

/**
 * Tampilan bintang untuk rating. Angka bintang disembunyikan dari pembaca
 * layar supaya yang diumumkan adalah nilainya.
 */
export function RatingStars({
  rating,
  count,
  size = 16,
  className = "",
}: RatingStarsProps) {
  const rounded = Math.round(rating);

  return (
    <span className={`inline-flex items-center gap-1 text-base text-tinta-lembut ${className}`}>
      <Icon name="star" size={size} className="shrink-0 text-perhatian" />
      <span className="font-semibold text-tinta">
        {rating.toFixed(1).replace(".", ",")}
      </span>
      {typeof count === "number" ? (
        <span>({count} ulasan)</span>
      ) : (
        <span className="sr-only">dari 5 bintang</span>
      )}
    </span>
  );
}
