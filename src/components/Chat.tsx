import { useEffect, useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { RealtimeChannel } from "@supabase/supabase-js";

interface Props {
  channel: RealtimeChannel;
}

const Chat = ({ channel }: Props) => {
  const [messageText, setMessageText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);
  const { currentUser } = useAuth();

  const handleSendMessage = async (message: string) => {
    if (!currentUser || !channel || !message) return;
    const newMessage = {
      player_id: currentUser.id,
      from: currentUser.user_metadata.firstName || currentUser.email,
      text: message,
    } as Message;
    await channel.send({
      type: "broadcast",
      event: "send-message",
      payload: {
        message: newMessage,
      },
    });
    setMessageText("");
    setMessages((prev) => [...prev, newMessage]);
  };

  useEffect(() => {
    channel.on("broadcast", { event: "send-message" }, (payload) => {
      const { message } = payload.payload;
      setMessages((prev) => [...prev, message as Message]);
    });
  }, [channel]);

  return (
    <>
      <div className="flex-1 overflow-y-auto">
        <h1 className="font-semibold text-2xl">Chat</h1>
        <div className="flex flex-col space-y-4">
          {messages.map((message, i) => (
            <div
              key={i}
              className={`flex flex-col items-start p-2 bg-gray-200 rounded-md w-52 w-full ${
                message.player_id === currentUser?.id ? "self-end" : "self-start"
              }`}
            >
              <p className="font-bold">{message.player_id === currentUser?.id ? "You" : message.from}</p>
              <p>{message.text}</p>
            </div>
          ))}
        </div>
      </div>
      <form
        className="flex"
        onSubmit={async (e) => {
          e.preventDefault();
          handleSendMessage(messageText);
        }}
      >
        <input
          className="flex-1 px-2 py-3 bg-gray-200 rounded-l-md"
          type="text"
          onChange={(e) => setMessageText(e.target.value)}
          value={messageText}
        />
        <button type="submit" className="px-2 py-3 bg-blue-400 rounded-r-md font-semibold text-white">
          Send
        </button>
      </form>
    </>
  );
};

export default Chat;
