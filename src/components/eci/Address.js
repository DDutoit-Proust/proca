import React from "react";

import { Typography, Container, Grid } from "@material-ui/core";
import TextField from "../TextField";
import Country from "../Country";
import { useTranslation } from "react-i18next";

export default function Register(props) {
  //  const setConfig = useCallback((d) => _setConfig(d), [_setConfig]);

  const { t } = useTranslation();

  const compact = props.compact;
  const form = props.form;

  return (
      <Container component="main" maxWidth="sm">
        <Typography variant="legend" color="textSecondary" gutterTop component="legend">{t("eci:form.group-address")}</Typography>
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <TextField
              form={form}
              name="lastname"
              label={t("eci:form.property.street")}
              placeholder="eg. Da Vinci"
              required
            />
          </Grid>
          <Grid item xs={12} sm= {compact ? 12 : 3}>
            <TextField
              form={form}
              name="postcode"
              label={t("eci:form.property.postal_code")}
              required
            />
          </Grid>
          <Grid item xs={12} sm= {compact ? 12 : 9}>
            <TextField
              form={form}
              name="city"
              label={t("eci:form.property.city")}
              required
            />
          </Grid>
           <Country form={form} />
         
        </Grid>
      </Container>
  );
}
