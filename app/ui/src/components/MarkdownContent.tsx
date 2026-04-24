import { useEditor, EditorContent } from "@tiptap/react"
import { useEffect } from "react"
import StarterKit from "@tiptap/starter-kit"
import { Markdown } from "tiptap-markdown"

interface MarkdownContentProps {
  content: string
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const editor = useEditor({
    extensions: [StarterKit, Markdown],
    content,
    editable: false,
    immediatelyRender: false,
  })

  useEffect(() => {
    if (!editor || editor.isDestroyed) return
    editor.commands.setContent(content, false)
  }, [content, editor])

  return <EditorContent editor={editor} className="markdown-content" />
}
