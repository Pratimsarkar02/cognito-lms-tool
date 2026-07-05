import PropTypes from "prop-types";
import { Quote, Star } from "lucide-react";

const TestimonialCard = ({ name, role, image, content, rating }) => {

TestimonialCard.propTypes = {
  name: PropTypes.string.isRequired,
  role: PropTypes.string.isRequired,
  image: PropTypes.string.isRequired,
  content: PropTypes.string.isRequired,
  rating: PropTypes.number.isRequired,
};
  return (
    <article className="flex h-full flex-col rounded-[28px] border border-slate-200 bg-white p-6 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <img
            src={image}
            alt={name}
            className="h-14 w-14 rounded-2xl object-cover ring-1 ring-slate-200"
          />

          <div>
            <h3 className="text-base font-semibold text-slate-900">{name}</h3>
            <p className="mt-1 text-sm text-slate-500">{role}</p>
          </div>
        </div>

        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Quote className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-5 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <Star
            key={index}
            className={`h-4 w-4 ${
              index < rating
                ? "fill-amber-400 text-amber-400"
                : "text-slate-200"
            }`}
          />
        ))}
      </div>

      <p className="mt-5 flex-1 text-sm leading-7 text-slate-600">{content}</p>
    </article>
  );
};

export default TestimonialCard;