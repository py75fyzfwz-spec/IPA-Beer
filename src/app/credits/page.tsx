import { sentences, sounds, words } from "@/content";

// Openly licensed recordings (e.g. CC BY-SA from Wikimedia Commons) must
// credit their authors. Every audio file with a credit is listed here.
export default function CreditsPage() {
  const credited = [...sounds, ...words, ...sentences].flatMap((item) =>
    item.audio?.credit ? [{ ipa: item.ipa, src: item.audio.src, ...item.audio.credit }] : [],
  );

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Audio credits</h1>
      {credited.length === 0 ? (
        <p className="text-muted">No recordings have been added yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-muted">
              <tr>
                <th className="py-2 pr-4 font-normal">Recording</th>
                <th className="py-2 pr-4 font-normal">Author</th>
                <th className="py-2 font-normal">Licence</th>
              </tr>
            </thead>
            <tbody>
              {credited.map((c) => (
                <tr key={c.src} className="border-t border-line">
                  <td className="py-2 pr-4 font-ipa text-base">
                    <a href={c.source} className="underline">/{c.ipa}/</a>
                  </td>
                  <td className="py-2 pr-4">{c.author}</td>
                  <td className="py-2">{c.license}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
