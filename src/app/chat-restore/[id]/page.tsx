import { readChat } from '../../../utils/chat-store';
import { ChatUiPersistence } from '../../../components/chat-ui-persistence';

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const messages = await readChat(id);
  // console.log(';; pps-page ', messages);

  return <ChatUiPersistence id={id} initialMessages={messages.messages} />;
}
