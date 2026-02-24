import { useState, useCallback, useEffect, useRef } from 'react'
import type {
  NodeExecutionStatus,
  Artifact,
  WorkflowExecutionResult,
  WorkflowEventSource,
  DemoNodeConfig,
} from '../domain/types'
import { createMockEventSource } from './execution-service'

// ── Return Type ─────────────────────────────────────────────────────────────

export interface UseWorkflowExecutionReturn {
  /** Current status of each node (keyed by node ID) */
  nodeStates: Map<string, NodeExecutionStatus>
  /** Accumulated artifacts from completed nodes */
  artifacts: Artifact[]
  /** Whether the workflow is currently executing */
  isRunning: boolean
  /** Whether execution has completed (persists until reset) */
  isComplete: boolean
  /** Final execution result (null until completion) */
  executionResult: WorkflowExecutionResult | null
  /** Start workflow execution */
  execute: (
    systemId: string,
    nodeIds: string[],
    connections: { from: string; to: string }[],
    nodeTypes?: Record<string, string>,
    demoConfigs?: Record<string, DemoNodeConfig>,
  ) => void
  /** Abort the running execution */
  stop: () => void
  /** Reset all state to initial values */
  reset: () => void
}

// ── Hook ────────────────────────────────────────────────────────────────────

export function useWorkflowExecution(
  eventSource?: WorkflowEventSource,
): UseWorkflowExecutionReturn {
  const [nodeStates, setNodeStates] = useState<
    Map<string, NodeExecutionStatus>
  >(new Map())
  const [artifacts, setArtifacts] = useState<Artifact[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [executionResult, setExecutionResult] =
    useState<WorkflowExecutionResult | null>(null)

  // Use provided event source or create a default mock
  const esRef = useRef<WorkflowEventSource>(
    eventSource ?? createMockEventSource(),
  )

  // Subscribe to event source
  useEffect(() => {
    const es = esRef.current

    const unsubStatus = es.onNodeStatus((event) => {
      setNodeStates((prev) => {
        const next = new Map(prev)
        next.set(event.nodeId, event.status)
        return next
      })
    })

    const unsubArtifact = es.onArtifact((artifact) => {
      setArtifacts((prev) => [...prev, artifact])
    })

    const unsubComplete = es.onComplete((result) => {
      setIsRunning(false)
      setIsComplete(true)
      setExecutionResult(result)
    })

    return () => {
      unsubStatus()
      unsubArtifact()
      unsubComplete()
      es.dispose()
    }
  }, [])

  const execute = useCallback(
    (
      systemId: string,
      nodeIds: string[],
      connections: { from: string; to: string }[],
      nodeTypes?: Record<string, string>,
      demoConfigs?: Record<string, DemoNodeConfig>,
    ) => {
      setNodeStates(new Map())
      setArtifacts([])
      setIsRunning(true)
      setIsComplete(false)
      setExecutionResult(null)
      esRef.current.execute(systemId, nodeIds, connections, nodeTypes, demoConfigs)
    },
    [],
  )

  const stop = useCallback(() => {
    esRef.current.abort()
    setIsRunning(false)
    setIsComplete(false)
    setNodeStates(new Map())
    setArtifacts([])
    setExecutionResult(null)
  }, [])

  const reset = useCallback(() => {
    setNodeStates(new Map())
    setArtifacts([])
    setIsRunning(false)
    setIsComplete(false)
    setExecutionResult(null)
  }, [])

  return {
    nodeStates,
    artifacts,
    isRunning,
    isComplete,
    executionResult,
    execute,
    stop,
    reset,
  }
}
