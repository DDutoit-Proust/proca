import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';

import { Container, Grid } from "@material-ui/core";
import { makeStyles } from "@material-ui/core/styles";

import {
  TextField,
  Button,
  Snackbar,
} from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import SendIcon from "@material-ui/icons/Send";
import DoneIcon from "@material-ui/icons/Done";

import useForm from "react-hook-form";
import { useTranslation } from "react-i18next";


import ProgressCounter from "../ProgressCounter";
import { addActionContact } from "../../lib/server.js";
import useElementWidth from '../../hooks/useElementWidth';
import {useCampaignConfig,setConfig} from '../../hooks/useConfig';
import useData from "../../hooks/useData";
import uuid from "../../lib/uuid.js";
import domparser from "../../lib/domparser";
import useCount from "../../hooks/useCount";
import Consent from "../Consent";
import {url as postcardUrl} from "./Download";

let defaultValues = {
  firstname: "",
  lastname: "",
  email: "",
  postcode: "",
  locality: "",
  address: "",
  country: "CH",
  comment: ""
};


const useStyles = makeStyles(theme => ({
  container: {
    display: "flex",
    flexWrap: "wrap"
  },

  textField: {
    marginLeft: theme.spacing(0),
    marginRight: theme.spacing(0),
    width: "100%"
  },
  "#petition-form": { position: "relative" },
  "@global": {
    "select:-moz-focusring": {
      color: "transparent",
      textShadow: "0 0 0 #000"
    },
    "input:valid + fieldset": {
      borderColor: "green",
      borderWidth: 2
    }
  }
}));

export default function Register(props) {
  const classes = useStyles();
  const { t } = useTranslation();
  const [status, setStatus] = useState("default");
  const config = useCampaignConfig();
  const [data, setData] = useData();

  const buttonRegister = config.buttonRegister || t("Sign");

  defaultValues = { ...defaultValues, ...config.data };
  const width = useElementWidth ('#proca-register');
  const [compact, setCompact] = useState(true);
  if ((compact && width > 450) || (!compact && width <= 450))
    setCompact (width <= 450);

  if (props.values) defaultValues = { ...defaultValues, ...props.values };
  const form = useForm({
    //    mode: "onBlur",
    //    nativeValidation: true,
    defaultValues: defaultValues
  });
  const {
    register,
    handleSubmit,
    setValue,
    errors,
    setError,
    clearErrors,
    watch,
    formState
  } = form; 
  //  const { register, handleSubmit, setValue, errors } = useForm({ mode: 'onBlur', defaultValues: defaultValues });

  const postcode = watch("postcode");
  const locality = watch("locality");

  const [autoLocality, setLocality] = useState("");
  const [region, setRegion] = useState("");
  useEffect(() => {
    if (postcode.length !== 4) return;
    const api = "https://postcode-ch.proca.foundation/"+postcode;

    async function fetchAPI() {
      await fetch(api)
      .then (res => {
        if (!res.ok) { throw Error(res.statusText); }
        return res.json()
      })
      .then(res => {if (res && res.name) {
        setLocality(res.name);
        setRegion(res.code1);
        setValue("locality", res.name);
      }})
      .catch(err => setError(err))
       
    }
    fetchAPI();
  },[postcode,setError,setValue]);


  const options = {
    margin: config.margin || "dense",
    variant: config.variant || "filled"
  };
  //variant: standard, filled, outlined
  //margin: normal, dense


  const onSubmit = async data => {
    data.tracking = config.utm;
    data.region=region;
    data.country="CH";
    data.LanguageCode = config.lang;
    console.log(config.param);
    console.log("submit",data);
    data.postcardUrl= postcardUrl(data, config.param);
    const result = await addActionContact("register",config.actionPage, data);
    if (result.errors) {
      result.errors.forEach(error => {
        const fields = error.message && error.message.split(":");
        if (fields.length === 2) {
          //setError(fields[0],{type:"manual",message:fields[1]});
          setError(fields[0],"manual",fields[1]);
        }
        console.log(error);
      });
      setStatus("error");
      return;
    }
    setStatus("success");
    delete data.tracking;
    delete data.privacy;

    uuid(result.contactRef); // set the global uuid as signature's fingerprint
    data.uuid = uuid();
    data.postcardUrl += "&qrcode="+uuid() + ":" + config.actionPage;
    setConfig('data',data);
    if (props.done instanceof Function) props.done({uuid:uuid(),firstname:data.firstname, country:data.country});

    // sends the signature's ID as fingerprint
  };

  useEffect(() => {
    register({ name: "postcode" });
  }, [postcode,register]);


  useEffect(() => {
    const inputs = document.querySelectorAll("input, select, textarea");
    // todo: workaround until the feature is native react-form ?
    inputs.forEach(input => {
      input.oninvalid = e => {
        setError(
          e.target.attributes.name.nodeValue,
          e.type,
          e.target.validationMessage
        );
      };
    });
  }, [register, setError]);

  const handleBlur = e => {
    e.target.checkValidity();
    if (e.target.validity.valid) {
      clearErrors(e.target.attributes.name.nodeValue);
      return;
    }
  };

  function minBirthdate () {
    let d = new Date();
    d.setFullYear(d.getFullYear()-18);
    return d.toISOString().substr(0,10);
  }

  function Error(props) {
    if (props.display)
      return (
        <Snackbar open={true} autoHideDuration={6000}>
          <Alert severity="error">
            Sorry, we couldn't save your signature!
            <br />
            The techies have been informed.
          </Alert>
        </Snackbar>
      );
    return null;
  }

  function Success(props) {
    if (props.display)
      return (
        <Snackbar open={true} autoHideDuration={6000}>
          <Alert severity="success">Done, Thank you for your support!</Alert>
        </Snackbar>
      );
    return null;
  }

  if (status === "success") {
    return (
      <Container component="main" maxWidth="sm">
        <Grid container spacing={1}>
          <Grid item xs={12}>
            <DoneIcon color="action" fontSize="large" my={4} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  return (
    <React.Fragment>
    <form
      className={classes.container}
      onSubmit={handleSubmit(onSubmit)}
      method="post"
      id="proca-register"
      url="http://localhost"
    >
      <Success display={status === "success"} />
      <Error display={status === "error"} />
      <Container component="main" maxWidth="sm">
        <Grid container spacing={1}>
          <Grid item xs={12} sm={compact ? 12 : 6}>
            <TextField
              id="firstname"
              name="firstname"
              label={t("First name")}
              className={classes.textField}
              placeholder="eg. Albert"
              autoComplete="given-name"
              required
              inputRef={register}
              onBlur={handleBlur}
              error={!!(errors && errors.firstname)}
              helperText={
                errors && errors.firstname && errors.firstname.message
              }
              variant={options.variant}
              margin={options.margin}
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 6}>
            <TextField
              id="lastname"
              name="lastname"
              label={t("Last name")}
              autoComplete="family-name"
              className={classes.textField}
              variant={options.variant}
              margin={options.margin}
              inputRef={register}
              placeholder="eg. Einstein"
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 6}>{errors && errors.email && errors.email.message}
            <TextField
              id="email"
              name="email"
              type="email"
              label={t("Email")}
              autoComplete="email"
              className={classes.textField}
              inputRef={register}
              onBlur={handleBlur}
              error={!!errors.email}
              helperText={errors && errors.email && errors.email.message}
              variant={options.variant}
              margin={options.margin}
              placeholder="your.email@example.org"
              required
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 6}>
            <TextField
              InputLabelProps={{ shrink: true }}
              inputProps= {{ max: minBirthdate(),'data-error-message':t("you need to be 18 years old")}}
              error={!!errors.birthdate}
              helperText={errors && errors.birthdate && t("you need to be 18 years old")}
              id="birthdate"
              name="birthdate"
              label={t("Birthdate")}
              className={classes.textField}
              onBlur={handleBlur}
              variant={options.variant}
              margin={options.margin}
              inputRef={register({validate: value =>{ //not useful anymore now that we have the html5 validation?
                if (!value) return;
                console.log(value,minBirthdate())
                if (value >= minBirthdate()) {
                  setError("birthdate","manual",t("you need to be 18 years old"));
                  return false;
                }
                return true;
              }})}
              type="date"
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 12}>
            <TextField
              name="address"
              label={t("Address")}
              className={classes.textField}
              variant={options.variant}
              margin={options.margin}
              inputRef={register}
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 3}>
            <TextField
              id="postcode"
              name="postcode"
              label={t("Postal Code")}
              onBlur={handleBlur}
              inputProps= {{ pattern: "[0-9]{4}", title:"9999"}}
              autoComplete="postal-code"
              required
              error={!!errors.postcode}
              helperText={errors && errors.postcode && errors.postcode.message}
              inputRef={register}
              className={classes.textField}
              variant={options.variant}
              margin={options.margin}
            />
          </Grid>
          <Grid item xs={12} sm={compact ? 12 : 9}>
            <TextField
              id="locality"
              name="locality"
              label={t("Locality")}
              autoComplete="address-level2"
              InputLabelProps = {{shrink : autoLocality !=='' || locality !=='' || false}}
              inputRef={register}
              className={classes.textField}
              variant={options.variant}
              margin={options.margin}
            />
          </Grid>
    <Consent organisation={props.organisation} privacy_url={config.privacyUrl} form={form}
    />
          <Grid item xs={12}>
            <Button
              color="primary"
              variant="contained"
              fullWidth
              type="submit"
              size="large"
              disabled={formState.isSubmitting}
              endIcon={<SendIcon />}
            >
              {" "}
    {buttonRegister}
            </Button>
          </Grid>
        </Grid>
      </Container>
    </form>
    </React.Fragment>
  );
}

Register.propTypes = {
  actionPage: PropTypes.number.isRequired,
}
Register.defaultProps = {
  buttonText: "Register",
}

