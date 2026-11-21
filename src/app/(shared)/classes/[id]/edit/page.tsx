"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { CLASS_SELECT } from "@/lib/data";
import type { ClassRow } from "@/lib/types";
import { ClassForm } from "@/components/ClassForm";
import { Empty, PageHeader, Spinner } from "@/components/ui";

export default function EditClassPage() {
  const { id } = useParams<{ id: string }>();
  const [c, setC] = useState<ClassRow | null | undefined>(undefined);
  useEffect(() => { supabase.from("classes").select(CLASS_SELECT).eq("id", id).maybeSingle().then(({ data }) => setC((data as ClassRow) ?? null)); }, [id]);
  if (c === undefined) return <Spinner />;
  if (!c) return <Empty title="Class not found" />;
  return (
    <>
      <PageHeader title="Edit class" subtitle="Families are notified automatically if the time changes." />
      <ClassForm existing={c} />
    </>
  );
}
