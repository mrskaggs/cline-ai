# Product Context

This document describes the "why" behind the project. It outlines the problems the project solves, how it should work from a user's perspective, and the desired user experience.

## Problem Statement

**Screeps AI development is complex and error-prone**, requiring extensive manual intervention and debugging. Most AI implementations suffer from:

- **Frequent crashes** due to unhandled errors and edge cases
- **Manual micromanagement** required for room progression and construction
- **Poor error visibility** making debugging difficult and time-consuming
- **Rigid architectures** that are hard to extend or modify
- **CPU inefficiency** leading to bucket depletion and performance issues
- **Memory serialization bugs** causing mysterious TypeError crashes

## Solution Vision

**A production-ready, autonomous Screeps AI** that handles room progression from RCL1→8 with zero human intervention, while providing:

- **Complete Autonomy**: Fresh rooms bootstrap and progress automatically
- **Robust Error Handling**: System never crashes, degrades gracefully under all conditions
- **Comprehensive Planning**: Intelligent building and road placement with traffic analysis
- **Modular Architecture**: Easy to extend, configure, and maintain
- **Production Stability**: Handles all edge cases, memory serialization issues, and API errors
- **Diagnostic Tools**: Clear visibility into system state and decision-making

## User Experience Goals

### For New Users
- **Zero Configuration**: Works out of the box with sensible defaults
- **Clear Documentation**: Comprehensive guides and examples
- **Easy Deployment**: Simple build and upload process
- **Immediate Results**: Rooms start progressing within minutes of deployment

### For Advanced Users
- **Highly Configurable**: Tune behavior through settings without code changes
- **Extensible Architecture**: Add new roles, managers, and planners easily
- **Diagnostic Visibility**: Rich logging and debugging tools
- **Performance Monitoring**: CPU usage, memory efficiency, and system metrics

### For Developers
- **Clean Codebase**: TypeScript with strict typing and clear separation of concerns
- **Comprehensive Testing**: Validation tests for all major systems
- **Error Recovery**: Graceful handling of all failure modes
- **Memory Safety**: Robust handling of Screeps memory serialization quirks

## Key Differentiators

1. **Production Stability**: Handles all known Screeps API quirks and edge cases
2. **Memory Serialization Safety**: Robust against position object prototype loss
3. **Comprehensive Error Handling**: Never crashes, always recovers gracefully
4. **Diagnostic-First Approach**: Tools to identify and fix issues quickly
5. **Traffic-Based Planning**: Roads placed based on actual usage patterns
6. **Priority-Based Construction**: Builders focus on high-priority structures first
7. **Automatic Recovery**: System detects and fixes invalid plans automatically

## Success Metrics

- **Uptime**: 99.9% tick execution success rate
- **Autonomy**: RCL1→3 progression with zero human intervention
- **Performance**: <90% CPU usage with efficient bucket management
- **Reliability**: No construction site placement errors or crashes
- **Maintainability**: Easy to extend and modify for new features
- **User Satisfaction**: Clear documentation and predictable behavior
