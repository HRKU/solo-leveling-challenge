import { redirect } from 'next/navigation'

/** Legacy weekly route — merged into Progress hub. */
export default function WeeklyCheckinPage() {
  redirect('/progress')
}
