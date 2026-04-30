import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Heading2,
  Heading3,
  Quote,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export default function RichTextEditor({
  content,
  onChange,
  placeholder = "Escreva suas anotações clínicas aqui...",
  className,
  readOnly = false,
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Placeholder.configure({ placeholder }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content,
    editable: !readOnly,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  if (!editor) return null;

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void;
    active?: boolean;
    children: React.ReactNode;
    title: string;
  }) => (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "h-7 w-7 flex items-center justify-center rounded transition-colors text-sm",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      )}
    >
      {children}
    </button>
  );

  return (
    <div className={cn("border border-input rounded-lg overflow-hidden bg-background tiptap-editor", className)}>
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-0.5 p-2 border-b border-border bg-muted/30">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Negrito"
          >
            <Bold className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Itálico"
          >
            <Italic className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive("underline")}
            title="Sublinhado"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Título 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            active={editor.isActive("heading", { level: 3 })}
            title="Título 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Lista"
          >
            <List className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Lista numerada"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive("blockquote")}
            title="Citação"
          >
            <Quote className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            active={editor.isActive({ textAlign: "left" })}
            title="Alinhar à esquerda"
          >
            <AlignLeft className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            active={editor.isActive({ textAlign: "center" })}
            title="Centralizar"
          >
            <AlignCenter className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            active={editor.isActive({ textAlign: "right" })}
            title="Alinhar à direita"
          >
            <AlignRight className="h-3.5 w-3.5" />
          </ToolbarButton>

          <div className="w-px h-5 bg-border mx-1" />

          <ToolbarButton
            onClick={() => editor.chain().focus().undo().run()}
            active={false}
            title="Desfazer"
          >
            <Undo className="h-3.5 w-3.5" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().redo().run()}
            active={false}
            title="Refazer"
          >
            <Redo className="h-3.5 w-3.5" />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} className="min-h-[200px]" />
    </div>
  );
}
