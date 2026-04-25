"use client";

import { useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Code2 } from "lucide-react";
import type { Language } from "@/services/api";

// Monaco editor is large; load it lazily to avoid SSR issues
const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

interface CodeEditorProps {
  value: string;
  language: Language;
  onChange: (code: string) => void;
  onLanguageChange: (lang: Language) => void;
}

const LANGUAGES: { value: Language; label: string; monacoLang: string }[] = [
  { value: "python",     label: "Python",     monacoLang: "python" },
  { value: "javascript", label: "JavaScript", monacoLang: "javascript" },
  { value: "java",       label: "Java",       monacoLang: "java" },
  { value: "php",        label: "PHP",        monacoLang: "php" },
];

const SAMPLE_CODE: Record<Language, string> = {
  python: `# Vulnerable Python — paste your own code or use this sample
import sqlite3

def get_user(user_id):
    conn = sqlite3.connect("app.db")
    cursor = conn.cursor()
    # SQL Injection vulnerability
    query = "SELECT * FROM users WHERE id=" + user_id
    cursor.execute(query)
    return cursor.fetchone()
`,
  javascript: `// Vulnerable JavaScript
const express = require("express");
const app = express();

app.get("/user", (req, res) => {
  // XSS vulnerability
  res.send("<h1>" + req.query.name + "</h1>");
});
`,
  java: `// Vulnerable Java
import java.sql.*;

public class UserDAO {
    public User findUser(String id) throws Exception {
        Connection conn = getConnection();
        // SQL Injection vulnerability
        Statement stmt = conn.createStatement();
        ResultSet rs = stmt.executeQuery(
            "SELECT * FROM users WHERE id=" + id
        );
        return mapToUser(rs);
    }
}
`,
  php: `<?php
// Vulnerable PHP
$user_id = $_GET['id'];
// SQL Injection vulnerability
$query = "SELECT * FROM users WHERE id=" . $user_id;
$result = mysqli_query($conn, $query);

// XSS vulnerability
echo "Hello " . $_GET['name'];
?>
`,
};

export function CodeEditor({ value, language, onChange, onLanguageChange }: CodeEditorProps) {
  const selectedLang = LANGUAGES.find((l) => l.value === language)!;

  const handleEditorChange = useCallback(
    (val: string | undefined) => onChange(val ?? ""),
    [onChange]
  );

  return (
    <div className="flex flex-col gap-3">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-[hsl(215,16%,55%)]">
          <Code2 className="w-4 h-4" />
          <span>Code Editor</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onChange(SAMPLE_CODE[language])}
            className="px-3 py-1 text-xs rounded-lg bg-[hsl(222,47%,12%)] hover:bg-[hsl(222,47%,16%)] text-[hsl(215,16%,55%)] hover:text-[hsl(213,31%,91%)] border border-[hsl(222,47%,14%)] transition-colors"
          >
            Load Sample
          </button>
          <button
            onClick={() => onChange("")}
            className="px-3 py-1 text-xs rounded-lg bg-[hsl(222,47%,12%)] hover:bg-[hsl(222,47%,16%)] text-[hsl(215,16%,55%)] hover:text-[hsl(213,31%,91%)] border border-[hsl(222,47%,14%)] transition-colors"
          >
            Clear
          </button>

          {/* Language selector */}
          <Select value={language} onValueChange={(v) => onLanguageChange(v as Language)}>
            <SelectTrigger className="w-36 h-7 text-xs bg-[hsl(222,47%,12%)] border-[hsl(222,47%,14%)]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-[hsl(222,47%,8%)] border-[hsl(222,47%,14%)]">
              {LANGUAGES.map((l) => (
                <SelectItem key={l.value} value={l.value} className="text-xs">
                  {l.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Editor */}
      <div className="rounded-xl overflow-hidden border border-[hsl(222,47%,14%)] h-80">
        <MonacoEditor
          height="100%"
          language={selectedLang.monacoLang}
          value={value}
          onChange={handleEditorChange}
          theme="vs-dark"
          options={{
            fontSize: 13,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            scrollBeyondLastLine: false,
            lineNumbers: "on",
            renderLineHighlight: "line",
            tabSize: 4,
            wordWrap: "on",
            padding: { top: 12, bottom: 12 },
          }}
        />
      </div>
    </div>
  );
}
