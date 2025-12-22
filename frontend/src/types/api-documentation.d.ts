// frontend/src/types/api-documentation.d.ts
declare module '*/api-documentation.json' {
  interface ApiEndpoint {
    method: string
    path: string
    description: string
    tags: string[]
    auth: boolean
    rateLimit: string
    dataCollected: string[]
    dataShared: string[]
    retention: string
    hipaaCompliant: boolean
    gdprCompliant: boolean
    requestBody?: any
    responseBody?: any
    parameters?: any[]
  }

  interface ApiDocumentation {
    endpoints: ApiEndpoint[]
    totalEndpoints: number
    generated: string
    version: string
  }

  const value: ApiDocumentation
  export default value
}
