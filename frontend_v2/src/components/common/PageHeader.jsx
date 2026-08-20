import SectionHeader from './SectionHeader';

// Alias for backwards compatibility — delegates to SectionHeader
export default function PageHeader(props) {
  return <SectionHeader {...props} />;
}
