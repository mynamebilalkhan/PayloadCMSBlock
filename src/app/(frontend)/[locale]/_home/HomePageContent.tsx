import { notFound } from 'next/navigation'
import { getPage } from '@/lib/pages/getPage'
import { DynamicRenderer } from '@/renderer'
import type { PopulatedBlockInstance } from '@/renderer'
import { RenderContentBlocks } from '@/blocks/RenderContentBlocks'
import { LivePreviewListener } from '@/components/LivePreviewListener'

interface HomePageContentProps {
  localeCode: string
  isDraftMode: boolean
}

export async function HomePageContent({ localeCode, isDraftMode }: HomePageContentProps) {
  const page = await getPage('/', localeCode, isDraftMode)
  if (!page) notFound()

  const dbLayout = (page.dbLayout ?? []) as unknown as PopulatedBlockInstance[]
  const serverURL = process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:3000'

  return (
    <>
      {isDraftMode && <LivePreviewListener serverURL={serverURL} />}
      <DynamicRenderer layout={dbLayout} />
      <RenderContentBlocks blocks={page.contentBlocks} />
    </>
  )
}
