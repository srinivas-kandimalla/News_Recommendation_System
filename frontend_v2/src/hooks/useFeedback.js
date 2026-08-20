import { useCallback, useState } from 'react';

export default function useFeedback() {
  const [feedback, setFeedback] = useState(null);
  const notify = useCallback((message, severity = 'success') => setFeedback({ message, severity }), []);
  const dismiss = useCallback(() => setFeedback(null), []);
  return { feedback, notify, dismiss };
}
