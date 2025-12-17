import { FormControl, Select, MenuItem } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { Language as LanguageIcon } from '@mui/icons-material';
import { useI18n, SUPPORTED_LANGUAGES } from '../i18n';
import type { Language } from '../i18n';

export function LanguageSelector() {
  const { language, setLanguage, t } = useI18n();

  const handleChange = (event: SelectChangeEvent<Language>) => {
    setLanguage(event.target.value as Language);
  };

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <Select
        value={language}
        onChange={handleChange}
        displayEmpty
        aria-label={t('common.language')}
        startAdornment={<LanguageIcon sx={{ mr: 1, color: 'action.active' }} />}
        sx={{
          '& .MuiSelect-select': {
            display: 'flex',
            alignItems: 'center',
          },
        }}
      >
        {SUPPORTED_LANGUAGES.map((lang) => (
          <MenuItem key={lang.code} value={lang.code}>
            {lang.nativeName}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}

export default LanguageSelector;
