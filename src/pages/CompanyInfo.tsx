import { useMemo, useState, useEffect } from "react";
import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-api";
import { Building2, Globe, MapPin } from "lucide-react";
import { buildApiUrl } from "@/lib/api";

const numberOrZero = (v: string) => (v === "" ? 0 : Number(v) || 0);

const CompanyInfo = () => {
  const { getCurrentCompany } = useAuth();
  const currentCompany = getCurrentCompany();

  // Company basic info
  const [companyName, setCompanyName] = useState(currentCompany?.company_name || "");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companyDescription, setCompanyDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Q1: Current numbers by age bands
  const [ageU19, setAgeU19] = useState("");
  const [age20s, setAge20s] = useState("");
  const [age30s, setAge30s] = useState("");
  const [age40s, setAge40s] = useState("");
  const [age50s, setAge50s] = useState("");
  const [age60p, setAge60p] = useState("");

  // Q2: Gender split
  const [male, setMale] = useState("");
  const [female, setFemale] = useState("");
  const [nonBinary, setNonBinary] = useState("");

  // Q3: Employment type
  const [fullTime, setFullTime] = useState("");
  const [partTime, setPartTime] = useState("");

  // Q4: Left company by age bands
  const [leftU19, setLeftU19] = useState("");
  const [left20s, setLeft20s] = useState("");
  const [left30s, setLeft30s] = useState("");
  const [left40s, setLeft40s] = useState("");
  const [left50s, setLeft50s] = useState("");
  const [left60p, setLeft60p] = useState("");

  // Q5: Training
  const [trainedTotal, setTrainedTotal] = useState("");
  const [employeesEndFY, setEmployeesEndFY] = useState("");

  // Q6: Diversity - Ethnicity tracking
  // Hong Kong ethnicities
  const [hkChinese, setHkChinese] = useState("");
  const [hkFilipino, setHkFilipino] = useState("");
  const [hkIndonesian, setHkIndonesian] = useState("");
  const [hkWhite, setHkWhite] = useState("");
  const [hkIndian, setHkIndian] = useState("");
  const [hkNepalese, setHkNepalese] = useState("");
  const [hkPakistani, setHkPakistani] = useState("");
  const [hkThai, setHkThai] = useState("");
  const [hkJapanese, setHkJapanese] = useState("");
  const [hkOtherAsian, setHkOtherAsian] = useState("");
  const [hkOtherPreferNot, setHkOtherPreferNot] = useState("");

  // New Zealand ethnicities
  const [nzEuropean, setNzEuropean] = useState("");
  const [nzMaori, setNzMaori] = useState("");
  const [nzSamoan, setNzSamoan] = useState("");
  const [nzTongan, setNzTongan] = useState("");
  const [nzCookIslands, setNzCookIslands] = useState("");
  const [nzChinese, setNzChinese] = useState("");
  const [nzIndian, setNzIndian] = useState("");
  const [nzFilipino, setNzFilipino] = useState("");
  const [nzOtherAsian, setNzOtherAsian] = useState("");
  const [nzMelaa, setNzMelaa] = useState("");
  const [nzOtherPreferNot, setNzOtherPreferNot] = useState("");

  const currentTotal = useMemo(() => (
    numberOrZero(ageU19) + numberOrZero(age20s) + numberOrZero(age30s) + numberOrZero(age40s) + numberOrZero(age50s) + numberOrZero(age60p)
  ), [ageU19, age20s, age30s, age40s, age50s, age60p]);

  const leftTotal = useMemo(() => (
    numberOrZero(leftU19) + numberOrZero(left20s) + numberOrZero(left30s) + numberOrZero(left40s) + numberOrZero(left50s) + numberOrZero(left60p)
  ), [leftU19, left20s, left30s, left40s, left50s, left60p]);

  // Turnover rate = left / (current + resigned)
  // Standard turnover rate calculation
  const turnoverRate = useMemo(() => {
    const denom = currentTotal + leftTotal;
    if (denom <= 0) return 0;
    return leftTotal / denom;
  }, [currentTotal, leftTotal]);

  const percentTrained = useMemo(() => {
    const endFY = numberOrZero(employeesEndFY);
    const trained = numberOrZero(trainedTotal);
    if (endFY <= 0) return 0;
    return trained / endFY;
  }, [employeesEndFY, trainedTotal]);

  const genderTotal = useMemo(() => (
    numberOrZero(male) + numberOrZero(female) + numberOrZero(nonBinary)
  ), [male, female, nonBinary]);

  // Diversity totals
  const hkDiversityTotal = useMemo(() => (
    numberOrZero(hkChinese) + numberOrZero(hkFilipino) + numberOrZero(hkIndonesian) + 
    numberOrZero(hkWhite) + numberOrZero(hkIndian) + numberOrZero(hkNepalese) + 
    numberOrZero(hkPakistani) + numberOrZero(hkThai) + numberOrZero(hkJapanese) + 
    numberOrZero(hkOtherAsian) + numberOrZero(hkOtherPreferNot)
  ), [hkChinese, hkFilipino, hkIndonesian, hkWhite, hkIndian, hkNepalese, hkPakistani, hkThai, hkJapanese, hkOtherAsian, hkOtherPreferNot]);

  const nzDiversityTotal = useMemo(() => (
    numberOrZero(nzEuropean) + numberOrZero(nzMaori) + numberOrZero(nzSamoan) + 
    numberOrZero(nzTongan) + numberOrZero(nzCookIslands) + numberOrZero(nzChinese) + 
    numberOrZero(nzIndian) + numberOrZero(nzFilipino) + numberOrZero(nzOtherAsian) + 
    numberOrZero(nzMelaa) + numberOrZero(nzOtherPreferNot)
  ), [nzEuropean, nzMaori, nzSamoan, nzTongan, nzCookIslands, nzChinese, nzIndian, nzFilipino, nzOtherAsian, nzMelaa, nzOtherPreferNot]);

  // Load company details on component mount
  useEffect(() => {
    if (currentCompany?.id) {
      loadCompanyDetails();
    }
  }, [currentCompany?.id]);

  const loadCompanyDetails = async () => {
    if (!currentCompany?.id) return;
    
    setLoading(true);
    try {
      const response = await fetch(buildApiUrl(`/api/company-details/${currentCompany.id}`));
      if (response.ok) {
        const data = await response.json();
        setCompanyWebsite(data.website || "");
        setCompanyDescription(data.description || "");
        
        // Load workforce data if it exists
        if (data.workforce_data) {
          const workforce = data.workforce_data;
          
          // Age bands
          if (workforce.age_bands) {
            setAgeU19(workforce.age_bands.u19?.toString() || "");
            setAge20s(workforce.age_bands["20s"]?.toString() || "");
            setAge30s(workforce.age_bands["30s"]?.toString() || "");
            setAge40s(workforce.age_bands["40s"]?.toString() || "");
            setAge50s(workforce.age_bands["50s"]?.toString() || "");
            setAge60p(workforce.age_bands["60p"]?.toString() || "");
          }
          
          // Gender
          if (workforce.gender) {
            setMale(workforce.gender.male?.toString() || "");
            setFemale(workforce.gender.female?.toString() || "");
            setNonBinary(workforce.gender.non_binary?.toString() || "");
          }
          
          // Employment type
          if (workforce.employment_type) {
            setFullTime(workforce.employment_type.full_time?.toString() || "");
            setPartTime(workforce.employment_type.part_time?.toString() || "");
          }
          
          // Turnover
          if (workforce.turnover) {
            setLeftU19(workforce.turnover.left_u19?.toString() || "");
            setLeft20s(workforce.turnover.left_20s?.toString() || "");
            setLeft30s(workforce.turnover.left_30s?.toString() || "");
            setLeft40s(workforce.turnover.left_40s?.toString() || "");
            setLeft50s(workforce.turnover.left_50s?.toString() || "");
            setLeft60p(workforce.turnover.left_60p?.toString() || "");
          }
          
          // Training
          if (workforce.training) {
            setTrainedTotal(workforce.training.trained_total?.toString() || "");
            setEmployeesEndFY(workforce.training.employees_end_fy?.toString() || "");
          }
          
          // Diversity - Hong Kong
          if (workforce.diversity_hk) {
            setHkChinese(workforce.diversity_hk.chinese?.toString() || "");
            setHkFilipino(workforce.diversity_hk.filipino?.toString() || "");
            setHkIndonesian(workforce.diversity_hk.indonesian?.toString() || "");
            setHkWhite(workforce.diversity_hk.white?.toString() || "");
            setHkIndian(workforce.diversity_hk.indian?.toString() || "");
            setHkNepalese(workforce.diversity_hk.nepalese?.toString() || "");
            setHkPakistani(workforce.diversity_hk.pakistani?.toString() || "");
            setHkThai(workforce.diversity_hk.thai?.toString() || "");
            setHkJapanese(workforce.diversity_hk.japanese?.toString() || "");
            setHkOtherAsian(workforce.diversity_hk.other_asian?.toString() || "");
            setHkOtherPreferNot(workforce.diversity_hk.other_prefer_not?.toString() || "");
          }
          
          // Diversity - New Zealand
          if (workforce.diversity_nz) {
            setNzEuropean(workforce.diversity_nz.european?.toString() || "");
            setNzMaori(workforce.diversity_nz.maori?.toString() || "");
            setNzSamoan(workforce.diversity_nz.samoan?.toString() || "");
            setNzTongan(workforce.diversity_nz.tongan?.toString() || "");
            setNzCookIslands(workforce.diversity_nz.cook_islands?.toString() || "");
            setNzChinese(workforce.diversity_nz.chinese?.toString() || "");
            setNzIndian(workforce.diversity_nz.indian?.toString() || "");
            setNzFilipino(workforce.diversity_nz.filipino?.toString() || "");
            setNzOtherAsian(workforce.diversity_nz.other_asian?.toString() || "");
            setNzMelaa(workforce.diversity_nz.melaa?.toString() || "");
            setNzOtherPreferNot(workforce.diversity_nz.other_prefer_not?.toString() || "");
          }
        }
      } else if (response.status !== 404) {
        // 404 is expected if no details exist yet
        toast.error("Failed to load company details");
      }
    } catch (error) {
      console.error("Error loading company details:", error);
      toast.error("Failed to load company details");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!currentCompany?.id) {
      toast.error("No company selected");
      return;
    }

    setSaving(true);
    try {
      // Prepare workforce data
      const workforceData = {
        age_bands: {
          u19: numberOrZero(ageU19),
          "20s": numberOrZero(age20s),
          "30s": numberOrZero(age30s),
          "40s": numberOrZero(age40s),
          "50s": numberOrZero(age50s),
          "60p": numberOrZero(age60p)
        },
        gender: {
          male: numberOrZero(male),
          female: numberOrZero(female),
          non_binary: numberOrZero(nonBinary)
        },
        employment_type: {
          full_time: numberOrZero(fullTime),
          part_time: numberOrZero(partTime)
        },
        turnover: {
          left_u19: numberOrZero(leftU19),
          left_20s: numberOrZero(left20s),
          left_30s: numberOrZero(left30s),
          left_40s: numberOrZero(left40s),
          left_50s: numberOrZero(left50s),
          left_60p: numberOrZero(left60p)
        },
        training: {
          trained_total: numberOrZero(trainedTotal),
          employees_end_fy: numberOrZero(employeesEndFY)
        },
        diversity_hk: {
          chinese: numberOrZero(hkChinese),
          filipino: numberOrZero(hkFilipino),
          indonesian: numberOrZero(hkIndonesian),
          white: numberOrZero(hkWhite),
          indian: numberOrZero(hkIndian),
          nepalese: numberOrZero(hkNepalese),
          pakistani: numberOrZero(hkPakistani),
          thai: numberOrZero(hkThai),
          japanese: numberOrZero(hkJapanese),
          other_asian: numberOrZero(hkOtherAsian),
          other_prefer_not: numberOrZero(hkOtherPreferNot)
        },
        diversity_nz: {
          european: numberOrZero(nzEuropean),
          maori: numberOrZero(nzMaori),
          samoan: numberOrZero(nzSamoan),
          tongan: numberOrZero(nzTongan),
          cook_islands: numberOrZero(nzCookIslands),
          chinese: numberOrZero(nzChinese),
          indian: numberOrZero(nzIndian),
          filipino: numberOrZero(nzFilipino),
          other_asian: numberOrZero(nzOtherAsian),
          melaa: numberOrZero(nzMelaa),
          other_prefer_not: numberOrZero(nzOtherPreferNot)
        }
      };

      // Prepare request data
      const requestData = {
        website: companyWebsite || null,
        description: companyDescription || null,
        workforce_data: workforceData
      };

      const response = await fetch(buildApiUrl(`/api/company-details/${currentCompany.id}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      });

      if (response.ok) {
        toast.success("Company information saved successfully!");
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || "Failed to save company information");
      }
    } catch (error) {
      console.error("Error saving company details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to save company information");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Company Information</h1>
          <p className="text-muted-foreground">Provide workforce and training information.</p>
          {loading && (
            <div className="text-sm text-muted-foreground">
              Loading company details...
            </div>
          )}
        </div>

        {/* Company Basic Information */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Company Details
            </CardTitle>
            <CardDescription>
              Basic company information and contact details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Company Name, Website, Location */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  disabled
                  className="bg-muted"
                />
              </div>
                <div className="space-y-2">
                  <Label htmlFor="companyWebsite" className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Website
                  </Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    placeholder="https://www.example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Location
                  </Label>
                  <Input
                    value={currentCompany?.location || ""}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              {/* Company Description */}
              <div className="space-y-2">
                <Label htmlFor="companyDescription">Company Description</Label>
                <textarea
                  id="companyDescription"
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  placeholder="Describe your company's business, mission, and key activities..."
                  className="w-full min-h-[100px] px-3 py-2 border border-input bg-background text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q1 */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Current numbers of employees by age</CardTitle>
            <CardDescription>Fill in employee counts for each age range.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Under or equal to 19 years old</Label>
                <Input type="number" min="0" value={ageU19} onChange={(e) => setAgeU19(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>20–29 years old</Label>
                <Input type="number" min="0" value={age20s} onChange={(e) => setAge20s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>30–39 years old</Label>
                <Input type="number" min="0" value={age30s} onChange={(e) => setAge30s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>40–49 years old</Label>
                <Input type="number" min="0" value={age40s} onChange={(e) => setAge40s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>50–59 years old</Label>
                <Input type="number" min="0" value={age50s} onChange={(e) => setAge50s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>60 or above years old</Label>
                <Input type="number" min="0" value={age60p} onChange={(e) => setAge60p(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-3">Current total: {currentTotal}</div>
          </CardContent>
        </Card>

        {/* Q2 */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Employees by gender</CardTitle>
            <CardDescription>Fill in the number of employees by gender identity.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Male</Label>
                <Input type="number" min="0" value={male} onChange={(e) => setMale(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Female</Label>
                <Input type="number" min="0" value={female} onChange={(e) => setFemale(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Non-binary</Label>
                <Input type="number" min="0" value={nonBinary} onChange={(e) => setNonBinary(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-3">Gender total: {genderTotal}</div>
          </CardContent>
        </Card>

        {/* Q3 */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Employment type</CardTitle>
            <CardDescription>Fill in the number of full-time and part-time employees.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full-time</Label>
                <Input type="number" min="0" value={fullTime} onChange={(e) => setFullTime(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Part-time</Label>
                <Input type="number" min="0" value={partTime} onChange={(e) => setPartTime(e.target.value)} placeholder="0" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q4 */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Employees who left by age</CardTitle>
            <CardDescription>Provide numbers of employees who left by age range. Turnover is auto-calculated.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Under or equal to 19 who left</Label>
                <Input type="number" min="0" value={leftU19} onChange={(e) => setLeftU19(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>20–29 who left</Label>
                <Input type="number" min="0" value={left20s} onChange={(e) => setLeft20s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>30–39 who left</Label>
                <Input type="number" min="0" value={left30s} onChange={(e) => setLeft30s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>40–49 who left</Label>
                <Input type="number" min="0" value={left40s} onChange={(e) => setLeft40s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>50–59 who left</Label>
                <Input type="number" min="0" value={left50s} onChange={(e) => setLeft50s(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>60 or above who left</Label>
                <Input type="number" min="0" value={left60p} onChange={(e) => setLeft60p(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-3">Left total: {leftTotal}</div>
            <div className="text-sm mt-1">Employee turnover rate: {(turnoverRate * 100).toFixed(2)}%</div>
          </CardContent>
        </Card>

        {/* Q5 */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle>Training</CardTitle>
            <CardDescription>Provide training coverage information.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Total number of employees trained</Label>
                <Input type="number" min="0" value={trainedTotal} onChange={(e) => setTrainedTotal(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>Total number of employees as of end of FY</Label>
                <Input type="number" min="0" value={employeesEndFY} onChange={(e) => setEmployeesEndFY(e.target.value)} placeholder="0" />
              </div>
              <div className="space-y-2">
                <Label>% of employees trained</Label>
                <Input disabled value={`${(percentTrained * 100).toFixed(2)}%`} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Q6: Diversity - Hong Kong */}
        {currentCompany?.location === 'Hong Kong' && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Workforce Diversity - Hong Kong</CardTitle>
              <CardDescription>Provide employee counts by ethnicity for Hong Kong location.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Chinese</Label>
                  <Input type="number" min="0" value={hkChinese} onChange={(e) => setHkChinese(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Filipino</Label>
                  <Input type="number" min="0" value={hkFilipino} onChange={(e) => setHkFilipino(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Indonesian</Label>
                  <Input type="number" min="0" value={hkIndonesian} onChange={(e) => setHkIndonesian(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>White</Label>
                  <Input type="number" min="0" value={hkWhite} onChange={(e) => setHkWhite(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Indian</Label>
                  <Input type="number" min="0" value={hkIndian} onChange={(e) => setHkIndian(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Nepalese</Label>
                  <Input type="number" min="0" value={hkNepalese} onChange={(e) => setHkNepalese(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Pakistani</Label>
                  <Input type="number" min="0" value={hkPakistani} onChange={(e) => setHkPakistani(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Thai</Label>
                  <Input type="number" min="0" value={hkThai} onChange={(e) => setHkThai(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Japanese</Label>
                  <Input type="number" min="0" value={hkJapanese} onChange={(e) => setHkJapanese(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Other Asian</Label>
                  <Input type="number" min="0" value={hkOtherAsian} onChange={(e) => setHkOtherAsian(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Other / Prefer not to say</Label>
                  <Input type="number" min="0" value={hkOtherPreferNot} onChange={(e) => setHkOtherPreferNot(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">Diversity total: {hkDiversityTotal}</div>
            </CardContent>
          </Card>
        )}

        {/* Q6: Diversity - New Zealand */}
        {currentCompany?.location === 'New Zealand' && (
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Workforce Diversity - New Zealand</CardTitle>
              <CardDescription>Provide employee counts by ethnicity for New Zealand location.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>European / Pākehā</Label>
                  <Input type="number" min="0" value={nzEuropean} onChange={(e) => setNzEuropean(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Māori</Label>
                  <Input type="number" min="0" value={nzMaori} onChange={(e) => setNzMaori(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Pacific Peoples – Samoan</Label>
                  <Input type="number" min="0" value={nzSamoan} onChange={(e) => setNzSamoan(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Pacific Peoples – Tongan</Label>
                  <Input type="number" min="0" value={nzTongan} onChange={(e) => setNzTongan(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Pacific Peoples – Cook Islands Māori</Label>
                  <Input type="number" min="0" value={nzCookIslands} onChange={(e) => setNzCookIslands(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Chinese</Label>
                  <Input type="number" min="0" value={nzChinese} onChange={(e) => setNzChinese(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Indian</Label>
                  <Input type="number" min="0" value={nzIndian} onChange={(e) => setNzIndian(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Filipino</Label>
                  <Input type="number" min="0" value={nzFilipino} onChange={(e) => setNzFilipino(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Other Asian</Label>
                  <Input type="number" min="0" value={nzOtherAsian} onChange={(e) => setNzOtherAsian(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>MELAA (Middle Eastern, Latin American, African)</Label>
                  <Input type="number" min="0" value={nzMelaa} onChange={(e) => setNzMelaa(e.target.value)} placeholder="0" />
                </div>
                <div className="space-y-2">
                  <Label>Other / Prefer not to say</Label>
                  <Input type="number" min="0" value={nzOtherPreferNot} onChange={(e) => setNzOtherPreferNot(e.target.value)} placeholder="0" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground mt-3">Diversity total: {nzDiversityTotal}</div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving || loading}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </Layout>
  );
};

export default CompanyInfo; 