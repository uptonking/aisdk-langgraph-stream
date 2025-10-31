import { redirect } from 'next/navigation';
import { createChat } from '../../utils/chat-store';

export default async function Page() {
  const id = await createChat();
  redirect(`/chat-restore/${id}`);
}
