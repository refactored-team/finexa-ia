package aiclient

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"finexa-ia/ms-transactions/internal/models"
)

type Client struct {
	baseURL string
	http    *http.Client
}

func New(baseURL string) *Client {
	return &Client{
		baseURL: strings.TrimRight(strings.TrimSpace(baseURL), "/"),
		http:    &http.Client{Timeout: 30 * time.Second},
	}
}

func (c *Client) Analyze(ctx context.Context, req models.AIPipelineAnalyzeRequest) (models.AIPipelineAnalyzeResponse, error) {
	var out models.AIPipelineAnalyzeResponse
	body, err := json.Marshal(req)
	if err != nil {
		return out, fmt.Errorf("marshal analyze request: %w", err)
	}
	httpReq, err := http.NewRequestWithContext(ctx, http.MethodPost, c.baseURL+"/analyze", bytes.NewReader(body))
	if err != nil {
		return out, fmt.Errorf("build analyze request: %w", err)
	}
	httpReq.Header.Set("Content-Type", "application/json")
	resp, err := c.http.Do(httpReq)
	if err != nil {
		return out, fmt.Errorf("call ai-pipeline analyze: %w", err)
	}
	defer resp.Body.Close()

	raw, err := ioReadAll(resp.Body)
	if err != nil {
		return out, fmt.Errorf("read ai-pipeline response: %w", err)
	}
	if resp.StatusCode != http.StatusOK {
		return out, fmt.Errorf("ai-pipeline returned status %d: %s", resp.StatusCode, strings.TrimSpace(string(raw)))
	}
	if err := json.Unmarshal(raw, &out); err != nil {
		return out, fmt.Errorf("decode ai-pipeline response: %w", err)
	}
	out.Raw = raw
	if !out.OK {
		return out, fmt.Errorf("ai-pipeline analyze returned ok=false")
	}
	return out, nil
}

func ioReadAll(r io.Reader) ([]byte, error) {
	var b bytes.Buffer
	_, err := b.ReadFrom(r)
	return b.Bytes(), err
}
