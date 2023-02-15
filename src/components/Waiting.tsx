import { MdContentCopy } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import { supabase } from "../lib/supabase";
import "react-toastify/dist/ReactToastify.css";

const Waiting = ({ uuid }: { uuid: string }) => {
  const navigate = useNavigate();

  const copyToClipboard = () => {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    toast.success("Copied to clipboard", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };
  return (
    <>
      <ToastContainer />
      <div className="flex flex-col items-center justify-center h-[65vh]">
        <div className="flex flex-col items-center justify-between mb-10">
          <p className="font-medium mb-2">Copy the ID and share with a friend to join the </p>
          <div className="flex items-center justify-between gap-6 bg-gray-100 px-4 py-2 rounded-md">
            <p className="cursor-pointer" onClick={copyToClipboard}>
              {uuid}
            </p>
            <button className="p-2 rounded-md bg-gray-200 hover:bg-gray-300" onClick={copyToClipboard}>
              <MdContentCopy />
            </button>
          </div>
        </div>
        <h1 className="text-2xl font-bold">Waiting for another player...</h1>

        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
          onClick={async () => {
            await supabase.from("games").delete().eq("uuid", uuid);
            navigate("/");
          }}
        >
          Cancel
        </button>
      </div>
    </>
  );
};

export default Waiting;
