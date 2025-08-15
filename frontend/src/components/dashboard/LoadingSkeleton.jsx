import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import PropTypes from 'prop-types';

export const CardSkeleton = ({ count = 3 }) => (
  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
    {Array(count).fill().map((_, idx) => (
      <div key={idx} className="bg-white p-4 rounded-lg shadow">
        <Skeleton height={24} width="60%" className="mb-2" />
        <Skeleton height={16} width="40%" />
        <Skeleton height={36} className="mt-2" />
      </div>
    ))}
  </div>
);

export const TableSkeleton = () => (
  <div className="animate-pulse space-y-4">
    <Skeleton height={40} />
    {Array(5).fill().map((_, idx) => (
      <Skeleton key={idx} height={30} />
    ))}
  </div>
);

export const QuestionSkeleton = () => (
  <div className="space-y-4">
    <Skeleton height={28} width="70%" />
    {[...Array(4)].map((_, i) => (
      <Skeleton key={i} height={20} />
    ))}
  </div>
);

export const LoadingSkeleton = ({ type }) => {
  const skeletonTypes = {
    fullscreen: (
      <div className="w-full h-screen flex items-center justify-center">
        <Skeleton circle width={80} height={80} />
      </div>
    ),
    table: (
      <div className="animate-pulse space-y-4">
        <Skeleton height={40} />
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} height={30} />
        ))}
      </div>
    ),
    card: (
      <div className="bg-white p-4 rounded-lg shadow">
        <Skeleton height={28} width="70%" className="mb-2" />
        <Skeleton count={3} />
      </div>
    )
  };

  return skeletonTypes[type] || skeletonTypes.card;
};

LoadingSkeleton.propTypes = {
  type: PropTypes.oneOf(['card', 'table', 'question', 'fullscreen']).isRequired
}; 

CardSkeleton.propTypes = {
  count: PropTypes.number
};
