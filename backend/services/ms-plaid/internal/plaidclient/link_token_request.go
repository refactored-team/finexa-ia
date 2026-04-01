package plaidclient

import (
	"fmt"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/plaid/plaid-go/v41/plaid"

	"finexa-ia/ms-plaid/internal/config"
)

const maxClientNameRunes = 30

// LinkTokenOverrides optional fields from the HTTP body (override config when set).
type LinkTokenOverrides struct {
	RedirectURI *string
	WebhookURL  *string
}

// BuildLinkTokenCreateRequest assembles a Plaid /link/token/create request.
func BuildLinkTokenCreateRequest(cfg *config.App, userID int64, overrides LinkTokenOverrides) (*plaid.LinkTokenCreateRequest, error) {
	clientName := strings.TrimSpace(cfg.PlaidClientName)
	if clientName == "" {
		clientName = "Finexa"
	}
	if utf8.RuneCountInString(clientName) > maxClientNameRunes {
		runes := []rune(clientName)
		clientName = string(runes[:maxClientNameRunes])
	}

	language := strings.TrimSpace(cfg.PlaidLanguage)
	if language == "" {
		language = "es"
	}

	countryCSV := strings.TrimSpace(cfg.PlaidCountryCodes)
	if countryCSV == "" {
		countryCSV = "US"
	}
	countries, err := parseCountryCodes(countryCSV)
	if err != nil {
		return nil, err
	}

	productsCSV := strings.TrimSpace(cfg.PlaidProducts)
	if productsCSV == "" {
		productsCSV = "transactions"
	}
	products, err := parseProducts(productsCSV)
	if err != nil {
		return nil, err
	}

	user := plaid.LinkTokenCreateRequestUser{
		ClientUserId: strconv.FormatInt(userID, 10),
	}

	req := plaid.NewLinkTokenCreateRequest(clientName, language, countries)
	req.SetUser(user)
	req.SetProducts(products)

	webhook := strings.TrimSpace(cfg.PlaidWebhook)
	if overrides.WebhookURL != nil && strings.TrimSpace(*overrides.WebhookURL) != "" {
		webhook = strings.TrimSpace(*overrides.WebhookURL)
	}
	if webhook != "" {
		req.SetWebhook(webhook)
	}

	redirect := strings.TrimSpace(cfg.PlaidRedirect)
	if overrides.RedirectURI != nil && strings.TrimSpace(*overrides.RedirectURI) != "" {
		redirect = strings.TrimSpace(*overrides.RedirectURI)
	}
	if redirect != "" {
		req.SetRedirectUri(redirect)
	}

	if hasProduct(products, plaid.PRODUCTS_TRANSACTIONS) && cfg.PlaidTransactionsDaysRequested != nil {
		d := *cfg.PlaidTransactionsDaysRequested
		if d < 1 {
			d = 1
		}
		if d > 730 {
			d = 730
		}
		req.SetTransactions(plaid.LinkTokenTransactions{DaysRequested: plaid.PtrInt32(d)})
	}

	return req, nil
}

func hasProduct(products []plaid.Products, p plaid.Products) bool {
	for _, x := range products {
		if x == p {
			return true
		}
	}
	return false
}

func parseCountryCodes(csv string) ([]plaid.CountryCode, error) {
	parts := splitCSV(csv)
	out := make([]plaid.CountryCode, 0, len(parts))
	for _, p := range parts {
		cc, err := toCountryCode(strings.ToUpper(p))
		if err != nil {
			return nil, err
		}
		out = append(out, cc)
	}
	return out, nil
}

func toCountryCode(s string) (plaid.CountryCode, error) {
	switch s {
	case "US":
		return plaid.COUNTRYCODE_US, nil
	case "GB":
		return plaid.COUNTRYCODE_GB, nil
	case "ES":
		return plaid.COUNTRYCODE_ES, nil
	case "NL":
		return plaid.COUNTRYCODE_NL, nil
	case "FR":
		return plaid.COUNTRYCODE_FR, nil
	case "IE":
		return plaid.COUNTRYCODE_IE, nil
	case "CA":
		return plaid.COUNTRYCODE_CA, nil
	case "DE":
		return plaid.COUNTRYCODE_DE, nil
	case "IT":
		return plaid.COUNTRYCODE_IT, nil
	case "PL":
		return plaid.COUNTRYCODE_PL, nil
	case "DK":
		return plaid.COUNTRYCODE_DK, nil
	case "NO":
		return plaid.COUNTRYCODE_NO, nil
	case "SE":
		return plaid.COUNTRYCODE_SE, nil
	case "EE":
		return plaid.COUNTRYCODE_EE, nil
	case "LT":
		return plaid.COUNTRYCODE_LT, nil
	case "LV":
		return plaid.COUNTRYCODE_LV, nil
	case "PT":
		return plaid.COUNTRYCODE_PT, nil
	case "BE":
		return plaid.COUNTRYCODE_BE, nil
	case "AT":
		return plaid.COUNTRYCODE_AT, nil
	case "FI":
		return plaid.COUNTRYCODE_FI, nil
	default:
		return "", fmt.Errorf("unsupported Plaid country code %q", s)
	}
}

func parseProducts(csv string) ([]plaid.Products, error) {
	parts := splitCSV(csv)
	out := make([]plaid.Products, 0, len(parts))
	for _, p := range parts {
		key := strings.ToLower(strings.TrimSpace(p))
		if key == "" {
			continue
		}
		prod := plaid.Products(key)
		if !prod.IsValid() {
			return nil, fmt.Errorf("unsupported Plaid product %q", key)
		}
		if prod == plaid.PRODUCTS_BALANCE {
			return nil, fmt.Errorf("product %q cannot be set in link token (see Plaid docs)", key)
		}
		out = append(out, prod)
	}
	if len(out) == 0 {
		return nil, fmt.Errorf("at least one Plaid product is required")
	}
	return out, nil
}

func splitCSV(s string) []string {
	var parts []string
	for _, seg := range strings.Split(s, ",") {
		t := strings.TrimSpace(seg)
		if t != "" {
			parts = append(parts, t)
		}
	}
	return parts
}
