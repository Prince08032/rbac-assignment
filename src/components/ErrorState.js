export default function ErrorState({ title, message, type = 'error' }) {
  const styles = {
    error: {
      bg: 'bg-red-50 dark:bg-red-900/20',
      text: 'text-red-800 dark:text-red-200',
      border: 'border-red-200 dark:border-red-800'
    },
    empty: {
      bg: 'bg-gray-50 dark:bg-gray-800',
      text: 'text-gray-600 dark:text-gray-300',
      border: 'border-gray-200 dark:border-gray-700'
    }
  };

  const style = styles[type];

  return (
    <div className={`p-8 rounded-lg border ${style.bg} ${style.border}`}>
      <div className="text-center">
        <h3 className={`text-lg font-medium mb-2 ${style.text}`}>
          {title}
        </h3>
        <p className={`text-sm ${style.text}`}>
          {message}
        </p>
      </div>
    </div>
  );
} 