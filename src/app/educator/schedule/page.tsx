"use client";
import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { fetchClasses } from "@/lib/data";
import { tz } from "@/lib/format";
import type { ClassRow } from "@/lib/types";
import { LinkButton, PageHeader, Spinner } from "@/components/ui";
import { Calendar } from "@/components/Calendar";

export default function EducatorSchedule() {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<ClassRow[] | null>(null);
  useEffect(() => { if (profile) fetchClasses({ educatorId: profile.id }).then(setClasses); }, [profile]);
  return (
    <>
      <PageHeader title="My schedule" subtitle={`All times in ${tz()}.`} actions={<LinkButton href="/classes/new"><Plus className="h-4 w-4" />New class</LinkButton>} />
      {classes ? <Calendar classes={classes} role="educator" /> : <Spinner />}
    </>
  );
}
