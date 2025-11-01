import { readChat } from '../../../utils/chat-store';
import { ChatUiResume } from './chat-resume';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const messages = await readChat(id);
  // console.log(';; pps-page ', messages);

  return (
    <ChatUiResume id={id} initialMessages={messages.messages} resume={true} />
  );
}
