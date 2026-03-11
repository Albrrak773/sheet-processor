import * as React from "react"
import { LinkInput } from "./link-input"
import { RawDataInput } from "./raw-data-input"
import { FileUploadInput } from "./file-upload-input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { detectLinkType } from "@/lib/url-detector"

interface InputTabsProps {
  onValidateUrl: (url: string) => void
  onValidateRaw: (data: string) => void
  onValidateFile: (file: File) => void
  isLoading: boolean
}

function InputTabs({
  onValidateUrl,
  onValidateRaw,
  onValidateFile,
  isLoading,
}: InputTabsProps) {
  const [linkValue, setLinkValue] = React.useState("")
  const [rawValue, setRawValue] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)

  function handleLinkSubmit() {
    const url = linkValue.trim()
    if (!url) return
    const type = detectLinkType(url)
    if (type === "unknown") return
    onValidateUrl(url)
  }

  function handleRawSubmit() {
    const data = rawValue.trim()
    if (!data) return
    onValidateRaw(data)
  }

  function handleFileSubmit() {
    if (!file) return
    onValidateFile(file)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Validate Data</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="link" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="link">Link</TabsTrigger>
            <TabsTrigger value="raw">Raw Data</TabsTrigger>
            <TabsTrigger value="upload">Upload File</TabsTrigger>
          </TabsList>

          <TabsContent value="link" className="space-y-4">
            <LinkInput
              value={linkValue}
              onChange={setLinkValue}
              onSubmit={handleLinkSubmit}
              disabled={isLoading}
            />
            <Button
              onClick={handleLinkSubmit}
              disabled={
                isLoading ||
                !linkValue.trim() ||
                detectLinkType(linkValue) === "unknown"
              }
              className="w-full"
            >
              {isLoading ? "Validating..." : "Validate"}
            </Button>
          </TabsContent>

          <TabsContent value="raw" className="space-y-4">
            <RawDataInput
              value={rawValue}
              onChange={setRawValue}
              disabled={isLoading}
            />
            <Button
              onClick={handleRawSubmit}
              disabled={isLoading || !rawValue.trim()}
              className="w-full"
            >
              {isLoading ? "Validating..." : "Validate"}
            </Button>
          </TabsContent>

          <TabsContent value="upload" className="space-y-4">
            <FileUploadInput
              file={file}
              onFileSelect={setFile}
              disabled={isLoading}
            />
            <Button
              onClick={handleFileSubmit}
              disabled={isLoading || !file}
              className="w-full"
            >
              {isLoading ? "Uploading & Validating..." : "Upload & Validate"}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

export { InputTabs }
