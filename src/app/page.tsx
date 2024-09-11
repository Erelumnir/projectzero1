'use client'
import Link from "next/link";
import styles from "./style/main.module.scss"

export default function Home() {
  return (
    <main className={styles.main}>
      <Link href={"/admin"}>Go To admin page</Link>
    </main>
  );
}
