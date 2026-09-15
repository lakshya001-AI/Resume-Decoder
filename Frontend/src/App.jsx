import { FileText, Server, Sparkles, UploadCloud } from 'lucide-react'
import { useState } from 'react'
import axios from "axios"

const App = () => {
  const [reply, setReply] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const callBackend = async () => {
    setLoading(true)
    setError(null)
    setReply(null)
    try {
      const res = await axios.get('/api/welcome')
      setReply(res.data.message)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm ring-1 ring-slate-200">
        <div className="flex items-center gap-3">
          <FileText className="size-8 text-indigo-600" strokeWidth={1.75} />
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Resume Analysis
          </h1>
        </div>

        <p className="mt-3 text-sm font-light leading-relaxed text-slate-600">
          Poppins, Tailwind CSS and Lucide icons are wired up and ready.
        </p>

        <button
          type="button"
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
        >
          <UploadCloud className="size-4" />
          Upload a resume
        </button>

        <button
          type="button"
          onClick={callBackend}
          disabled={loading}
          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Server className="size-4" />
          {loading ? 'Calling backend…' : 'Call backend'}
        </button>

        {reply && (
          <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-light text-emerald-800 ring-1 ring-emerald-200">
            {reply}
          </p>
        )}

        {error && (
          <p className="mt-4 rounded-xl bg-rose-50 px-4 py-3 text-sm font-light text-rose-800 ring-1 ring-rose-200">
            {error}
          </p>
        )}

        <div className="mt-4 flex items-center justify-center gap-1.5 text-xs font-light text-slate-500">
          <Sparkles className="size-3.5" />
          PDF or DOCX, up to 5 MB
        </div>
      </div>
    </div>
  )
}

export default App
